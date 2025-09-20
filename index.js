const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');
const { sendLog } = require('./logger');
const { startVipMonitor } = require('./utils/vipManager');
const { checkAndBackup } = require('./utils/backupManager');
const ms = require('ms');

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

// ===== Coleções e Carregamento de Comandos =====
client.commands = new Collection();
client.cooldowns = new Collection();
const economyCooldowns = new Collection();

console.log('[Carregador] Iniciando o carregamento de comandos...');
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(path.join(folderPath, file));
                if (command.name) {
                    client.commands.set(command.name, command);
                }
            } catch (error) {
                console.error(`[Carregador] ❌ Falha ao carregar o comando no arquivo '${file}':`, error);
            }
        }
    }
}
console.log('[Carregador] Carregamento de comandos finalizado.');


// ===== Arquivos de Dados =====
const economyFile = path.join(__dirname, 'economy.json');
const usageFile = path.join(__dirname, 'command_usage.json');
const remindersFile = path.join(__dirname, 'rep_reminders.json');

if (!fs.existsSync(economyFile)) {
    fs.writeFileSync(economyFile, JSON.stringify({}, null, 2));
}
client.economy = {
    loadEconomy: () => {
        try {
            const rawData = fs.readFileSync(economyFile, 'utf8');
            return rawData ? JSON.parse(rawData) : {};
        } catch (e) {
            console.error("ERRO AO LER economy.json. Retornando objeto vazio.", e);
            return {};
        }
    },
    saveEconomy: (data) => {
        fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
        checkAndBackup(client, economyFile);
    },
};

// ===== Funções do Sistema de Lembrete de +Rep =====
function loadReminders() {
    if (!fs.existsSync(remindersFile)) return [];
    try {
        const rawData = fs.readFileSync(remindersFile, 'utf8');
        return rawData ? JSON.parse(rawData) : [];
    } catch { return []; }
}
function saveReminders(reminders) {
    fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
}
function startRepReminder(client) {
    setInterval(async () => {
        let reminders = loadReminders();
        const now = Date.now();
        const dueReminders = reminders.filter(r => r.remindAt <= now);
        if (dueReminders.length > 0) {
            try {
                const { REMINDER_CHANNEL_ID } = require('./config.json');
                if (!REMINDER_CHANNEL_ID) return console.log("[Lembrete] REMINDER_CHANNEL_ID não configurado.");
                const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
                if (channel) {
                    for (const reminder of dueReminders) {
                        const reminderEmbed = new EmbedBuilder()
                            .setColor('#3498DB')
                            .setAuthor({ name: 'Lembrete de Cooldown!', iconURL: client.user.displayAvatarURL() })
                            .setDescription(`Ei, <@${reminder.userId}>! Já se passou 1 hora. Você já pode usar o comando \`+rep\` novamente!`)
                            .setFooter({ text: 'Use o comando para fortalecer a comunidade.' })
                            .setTimestamp();
                        await channel.send({ content: `<@${reminder.userId}>`, embeds: [reminderEmbed] });
                    }
                }
            } catch (error) { console.error(`[Lembrete] Falha ao enviar lembretes no canal:`, error); }
            const remainingReminders = reminders.filter(r => r.remindAt > now);
            saveReminders(remainingReminders);
        }
    }, ms('1m')); 
    console.log('✅ Sistema de lembretes de +rep (direto no canal) iniciado.');
}

// ===== Evento de Bot Pronto =====
client.once('clientReady', () => {
    console.log(`🤖 Gamer World Bot online como ${client.user.tag}`);
    try {
        startVipMonitor(client);
        startRepReminder(client);
    } catch (error) {
        console.error('❌ Falha ao iniciar monitores:', error);
    }
});


// ===== Evento de Mensagem (COM A CORREÇÃO FINAL PARA LORITTA) =====
client.on('messageCreate', async message => {
    if (message.author.bot && message.author.id !== '297153970613387264') return;
    if (!message.guild) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (!command) return;

        // Lógica de Cooldown Antiraid
        if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⏳ Por favor, aguarde **${timeLeft.toFixed(1)}s** para usar este comando novamente.`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // RASTREAMENTO DE USO DE COMANDOS
        try {
            let usageData = {};
            if (fs.existsSync(usageFile)) {
                const rawData = fs.readFileSync(usageFile, 'utf8');
                if (rawData) usageData = JSON.parse(rawData);
            }
            const userId = message.author.id;
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (!usageData[userId]) {
                usageData[userId] = { monthlyCount: 0, lastMonth: "0000-00" };
            }
            if (usageData[userId].lastMonth !== currentMonth) {
                usageData[userId].monthlyCount = 1;
                usageData[userId].lastMonth = currentMonth;
            } else {
                usageData[userId].monthlyCount += 1;
            }
            fs.writeFileSync(usageFile, JSON.stringify(usageData, null, 2));
        } catch (error) {
            console.error("Erro ao rastrear uso de comando:", error);
        }

        // Execução do Comando
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Erro no comando '${commandName}':`, error);
            message.reply('❌ Ops! Ocorreu um erro inesperado.');
            sendLog(client, 'error', { commandName, error, guildName: message.guild.name, guildId: message.guild.id });
        }
    } else {
        // --- Se NÃO for um comando, processa o detector de +rep e o ganho de moedas ---
        
        // DETECTOR DE RESPOSTA DA LORITTA (CORRIGIDO)
        if (message.author.id === '297153970613387264') { // ID da Loritta
            const successMessage = "deu uma reputação para";
            if (message.content.includes(successMessage)) {
                
                // Usa uma expressão regular para encontrar o primeiro ID de usuário na mensagem
                const match = message.content.match(/<@(\d+)>/);
                
                if (match && match[1]) {
                    const userId = match[1]; // O ID do usuário que deu o +rep
                    
                    let reminders = loadReminders();
                    reminders = reminders.filter(r => r.userId !== userId);
                    reminders.push({ userId: userId, remindAt: Date.now() + ms('1h') });
                    saveReminders(reminders);

                    console.log(`[Lembrete +rep] Lembrete agendado para o usuário com ID: ${userId}`);
                    try { await message.react('⏰'); } catch {}
                }
            }
        }
        
        // GANHO DE MOEDAS POR MENSAGEM (apenas para usuários)
        if (!message.author.bot) {
            if (!economyCooldowns.has(message.author.id)) {
                economyCooldowns.set(message.author.id, Date.now());
                setTimeout(() => economyCooldowns.delete(message.author.id), 3000);
                
                let data = client.economy.loadEconomy();
                const userId = message.author.id;
                const userData = data[userId];
                const currentBalance = userData?.balance || userData || 0;
                const amount = Math.floor(Math.random() * 5) + 1;
                data[userId] = currentBalance + amount;
                client.economy.saveEconomy(data);
            }
        }
    }
});


// ===== Captura de Erros Globais =====
process.on('unhandledRejection', error => {
    console.error('ERRO GLOBAL (Unhandled Rejection):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Unhandled Rejection)' });
});

process.on('uncaughtException', error => {
    console.error('ERRO GLOBAL (Uncaught Exception):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Uncaught Exception)' });
});


// ===== Login =====
client.login(token);