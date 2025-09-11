const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');
const db = require('./database'); // banco SQLite

// ===== Criar client =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

client.commands = new Collection();

// ===== Carregar comandos =====
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

const cooldowns = new Collection();

// ===== Quando ligar =====
client.once('ready', () => {
    console.log(`🤖 Gamer World Bot online como ${client.user.tag}`);
    if (typeof scheduleGiveaway === 'function') scheduleGiveaway(client);
});

// ===== Mensagens =====
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const now = Date.now();
    const cooldownAmount = 3000;

    // ===== Registrar mensagens para sorteio =====
    if (typeof handleMessage === 'function') handleMessage(message);

    // ===== Anti-Flood (economia) =====
    if (!cooldowns.has(userId)) {
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        const amount = Math.floor(Math.random() * 5) + 1;

        // Pega saldo atual
        let row = db.prepare("SELECT coins FROM economy WHERE userId = ?").get(userId);
        const balance = row ? row.coins + amount : amount;

        // Atualiza ou insere saldo
        db.prepare(`
            INSERT INTO economy (userId, coins) VALUES (?, ?)
            ON CONFLICT(userId) DO UPDATE SET coins = ?
        `).run(userId, balance, balance);
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
