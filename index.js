const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');
// IMPORTAÇÕES ADICIONADAS
const { sendLog } = require('./logger');
const { startVipMonitor } = require('./utils/vipManager');

// ===== Criar client =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

// COLEÇÕES PARA GERENCIAMENTO AVANÇADO
client.commands = new Collection();
client.cooldowns = new Collection(); // Para o sistema antiraid de comandos

// ===== Carregar comandos (seu código, sem alterações) =====
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));
            if (command.name) client.commands.set(command.name, command);
        }
    }
}

// ===== Economia (seu código, sem alterações) =====
const economyFile = path.join(__dirname, 'economy.json');
if (!fs.existsSync(economyFile)) {
    fs.writeFileSync(economyFile, JSON.stringify({}, null, 2));
}
client.economy = {
    loadEconomy: () => JSON.parse(fs.readFileSync(economyFile, 'utf8')),
    saveEconomy: (data) => fs.writeFileSync(economyFile, JSON.stringify(data, null, 2)),
};
const economyCooldowns = new Collection(); // Renomeado para não conflitar

// ===== Quando ligar =====
client.once('clientReady', () => {
    console.log(`🤖 Gamer World Bot online como ${client.user.tag}`);
    
    // INICIA O MONITOR DE VIPS
    try {
        startVipMonitor(client);
        console.log('✅ Monitor de VIPs iniciado com sucesso.');
    } catch (error) {
        console.error('❌ Falha ao iniciar o monitor de VIPs:', error);
    }
});

// ===== Mensagens =====
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // ===== Sistema de Economia por mensagem (ATUALIZADO E PADRONIZADO) =====
    if (!economyCooldowns.has(message.author.id)) {
        economyCooldowns.set(message.author.id, Date.now());
        setTimeout(() => economyCooldowns.delete(message.author.id), 3000);

        let data = client.economy.loadEconomy();
        const userId = message.author.id;
        
        // CORREÇÃO: Lê o saldo de forma inteligente (de um objeto ou de um número)
        const currentBalance = data[userId]?.balance || data[userId] || 0;
        const amount = Math.floor(Math.random() * 5) + 1;
        const newBalance = currentBalance + amount;

        // CORREÇÃO: Garante que o usuário seja salvo no formato de objeto
        if (!data[userId] || typeof data[userId] !== 'object') {
            data[userId] = {};
        }
        data[userId].balance = newBalance;

        client.economy.saveEconomy(data);
    }

    // ===== Processador de Comandos com Antiraid e Log de Erros =====
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    // --- LÓGICA DE COOLDOWN ANTIRAID ---
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`⏳ Por favor, aguarde **${timeLeft.toFixed(1)}s** para usar este comando novamente.`)
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // --- EXECUÇÃO E CAPTURA DE ERROS ---
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Erro no comando '${commandName}':`, error);
        message.reply('❌ Ops! Ocorreu um erro inesperado ao executar este comando.');

        // Envia o log de erro para o canal configurado
        await sendLog(client, 'error', {
            commandName: commandName,
            error: error,
            guildName: message.guild.name,
            guildId: message.guild.id
        });
    }
});

// ===== CAPTURA DE ERROS GLOBAIS =====
process.on('unhandledRejection', error => {
    console.error('ERRO GLOBAL (Unhandled Rejection):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Unhandled Rejection)' });
});

process.on('uncaughtException', error => {
    console.error('ERRO GLOBAL (Uncaught Exception):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Uncaught Exception)' });
});

client.login(token);