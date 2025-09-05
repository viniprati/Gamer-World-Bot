const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// ===== Carregar comandos (diretos e em subpastas) =====
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));

for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
        // Carrega todos os arquivos .js dentro da pasta
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(folderPath, file));
            client.commands.set(command.name, command);
        }
    } else if (folder.endsWith('.js')) {
        // Carrega arquivos .js diretos na pasta commands
        const command = require(path.join(__dirname, 'commands', folder));
        client.commands.set(command.name, command);
    }
}

// ===== Variáveis para economia =====
const economyFile = path.join(__dirname, 'economy.json'); // JSON na raiz
const cooldowns = new Collection(); // anti-flood moedas

client.once('ready', () => {
    console.log(`Gamer World Bot está online! Logado como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const now = Date.now();
    const cooldownAmount = 3000; // 3 segundos entre moedas

    // ===== Anti-Flood para moedas =====
    if (!cooldowns.has(userId)) {
        cooldowns.set(userId, now);
        setTimeout(() => cooldowns.delete(userId), cooldownAmount);

        // Adiciona moedas
        let data = {};
        if (fs.existsSync(economyFile)) {
            data = JSON.parse(fs.readFileSync(economyFile, 'utf8'));
        }

        const amount = Math.floor(Math.random() * 5) + 1; // 1-5 moedas
        if (!data[userId]) data[userId] = 0;
        data[userId] += amount;

        fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
    }

    // ===== Processa comandos =====
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('Houve um erro ao executar este comando!');
    }
});

client.login(token);
