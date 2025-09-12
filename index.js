const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');

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

client.commands = new Collection();

// ===== Carregar comandos (diretos e em subpastas) =====
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);

    if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));
            if (command.name) client.commands.set(command.name, command);
        }
    } else if (folder.endsWith('.js')) {
        const command = require(path.join(__dirname, 'commands', folder));
        if (command.name) client.commands.set(command.name, command);
    }
}

// ===== Economia =====
const economyFile = path.join(__dirname, 'economy.json');

if (!fs.existsSync(economyFile)) {
    fs.writeFileSync(economyFile, JSON.stringify({}, null, 2));
}

function loadEconomy() {
    return JSON.parse(fs.readFileSync(economyFile, 'utf8'));
}

function saveEconomy(data) {
    fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
}

client.economy = { loadEconomy, saveEconomy };

const cooldowns = new Collection();

// ===== Quando ligar =====
// CORREÇÃO: Alterado de 'ready' para 'clientReady' para remover o aviso.
client.once('clientReady', () => {
    console.log(`🤖 Gamer World Bot online como ${client.user.tag}`);
    // A lógica de giveaway precisa ser importada e definida para funcionar
    // if (typeof scheduleGiveaway === 'function') scheduleGiveaway(client); 
});

// ===== Mensagens =====
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const now = Date.now();
    const cooldownAmount = 3000;

    // ===== Registrar mensagens para sorteio =====
    // A lógica de sorteio precisa ser importada e definida para funcionar
    // if (typeof handleMessage === 'function') handleMessage(message);

    // ===== Anti-Flood (economia) =====
    if (!cooldowns.has(userId)) {
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        let data = client.economy.loadEconomy();
        // Garante que o usuário tenha um campo 'balance'
        if (!data[userId] || typeof data[userId].balance === 'undefined') {
            if (!data[userId]) data[userId] = {};
            data[userId].balance = 0;
        }
        const amount = Math.floor(Math.random() * 5) + 1;
        data[userId].balance += amount;

        client.economy.saveEconomy(data);
    }

    // ===== Comandos =====
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ Houve um erro ao executar este comando!');
    }
});

client.login(token);