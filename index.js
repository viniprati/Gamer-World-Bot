const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ms = require('ms');
const { sendLog } = require('./logger');
const { startVipMonitor } = require('./utils/vipManager');
const { startTempRoleMonitor } = require('./utils/tempRoleManager');
const { startLiveLeaderboard, scheduleDailyWinner } = require('./utils/dailyTopManager');
const { startReminderMonitor, syncExistingCooldowns } = require('./utils/reminderManager');
const { getConfig, getRequiredConfig } = require('./utils/config');
const { loadEconomy, saveEconomy, addBalance } = require('./utils/economyManager');

const token = getRequiredConfig('TOKEN');
const prefix = getConfig('PREFIX', '!');
const reminderChannelId = getConfig('REMINDER_CHANNEL_ID');

const usageFile = path.join(__dirname, 'command_usage.json');
const dailyTopPath = path.join(__dirname, 'daily_top.json');
const repReminderFile = path.join(__dirname, 'rep_reminders.json');

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
client.aliases = new Collection();
client.cooldowns = new Collection();
const economyCooldowns = new Collection();

client.economy = {
    loadEconomy,
    saveEconomy: data => saveEconomy(data, client),
};

function loadJsonSafe(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
            return fallback;
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveJsonSafe(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function loadRepReminders() {
    return loadJsonSafe(repReminderFile, []);
}

function saveRepReminders(reminders) {
    saveJsonSafe(repReminderFile, reminders);
}

function resolveCommand(name) {
    return client.commands.get(name) || client.commands.get(client.aliases.get(name));
}

function getCommandKey(command) {
    return command.data?.name || command.name;
}

function checkAndApplyCooldown(command, userId) {
    const commandKey = getCommandKey(command);
    if (!client.cooldowns.has(commandKey)) {
        client.cooldowns.set(commandKey, new Collection());
    }

    const timestamps = client.cooldowns.get(commandKey);
    const now = Date.now();
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;
        if (now < expirationTime) {
            return (expirationTime - now) / 1000;
        }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
    return 0;
}

function trackCommandUsage(userId, command) {
    const usageData = loadJsonSafe(usageFile, {});
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (!usageData[userId] || usageData[userId].lastMonth !== currentMonth) {
        usageData[userId] = { monthlyCount: 1, lastMonth: currentMonth };
    } else {
        usageData[userId].monthlyCount += 1;
    }
    saveJsonSafe(usageFile, usageData);

    const commandsToIgnore = ['addcoins', 'removecoins'];
    if (command.category === 'economia' && !commandsToIgnore.includes(command.name)) {
        const dailyData = loadJsonSafe(dailyTopPath, {});
        const today = new Date().toISOString().slice(0, 10);
        if (!dailyData[today]) dailyData[today] = {};
        if (!dailyData[today][userId]) dailyData[today][userId] = 0;
        dailyData[today][userId] += 1;
        saveJsonSafe(dailyTopPath, dailyData);
    }
}

function loadCommands() {
    console.log('[Loader] Starting command loading...');
    const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, 'commands', folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(path.join(folderPath, file));
                command.category = folder;
                const commandName = getCommandKey(command);
                if (!commandName) {
                    console.warn(`[Loader] File ${file} ignored: invalid command shape.`);
                    continue;
                }

                client.commands.set(commandName, command);
                if (Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        if (!client.aliases.has(alias)) {
                            client.aliases.set(alias, commandName);
                        }
                    }
                }
            } catch (error) {
                console.error(`[Loader] Failed to load ${file}:`, error);
            }
        }
    }
    console.log(`[Loader] Loaded ${client.commands.size} commands and ${client.aliases.size} aliases.`);
}

function startRepReminder() {
    console.log('[Rep Reminder] Monitor started. Checking every minute...');
    setInterval(async () => {
        const reminders = loadRepReminders();
        const now = Date.now();
        const due = reminders.filter(r => r.remindAt <= now);
        if (due.length === 0) return;

        if (!reminderChannelId) {
            console.log('[Rep Reminder] REMINDER_CHANNEL_ID not configured.');
            return;
        }

        try {
            const channel = await client.channels.fetch(reminderChannelId);
            if (!channel) return;

            for (const reminder of due) {
                const embed = new EmbedBuilder()
                    .setColor('#3498DB')
                    .setAuthor({ name: 'Reminder', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`Hey <@${reminder.userId}>, you can use \`+rep\` again.`)
                    .setTimestamp();
                await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
            }
        } catch (error) {
            console.error('[Rep Reminder] Failed to send reminder:', error);
        }

        const remaining = reminders.filter(r => r.remindAt > now);
        saveRepReminders(remaining);
    }, ms('1m'));
}

loadCommands();

client.once('clientReady', () => {
    console.log(`[Bot] Online as ${client.user.tag}`);
    try {
        syncExistingCooldowns();
        startVipMonitor(client);
        startRepReminder();
        startTempRoleMonitor(client);
        startLiveLeaderboard(client);
        scheduleDailyWinner(client);
        startReminderMonitor(client);
    } catch (error) {
        console.error('[Startup] Failed to start monitors:', error);
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = (args.shift() || '').toLowerCase();
        const command = resolveCommand(commandName);
        if (!command) return;

        const timeLeft = checkAndApplyCooldown(command, message.author.id);
        if (timeLeft > 0) {
            return message.reply(`Please wait **${timeLeft.toFixed(1)}s** before using this command again.`);
        }

        try {
            trackCommandUsage(message.author.id, command);
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`[Command] Prefix ${commandName} failed:`, error);
            message.reply('Unexpected error while running command.');
            sendLog(client, 'error', {
                commandName,
                error,
                guildName: message.guild.name,
                guildId: message.guild.id
            });
        }
        return;
    }

    if (message.author.id === '297153970613387264' && /deu uma reputa..o para/i.test(message.content)) {
        const match = message.content.match(/<@(\d+)>/);
        if (match?.[1]) {
            const userId = match[1];
            const reminders = loadRepReminders().filter(r => r.userId !== userId);
            reminders.push({ userId, remindAt: Date.now() + ms('1h') });
            saveRepReminders(reminders);
            try { await message.react('⏰'); } catch {}
        }
    }

    if (economyCooldowns.has(message.author.id)) return;

    economyCooldowns.set(message.author.id, Date.now());
    setTimeout(() => economyCooldowns.delete(message.author.id), 3000);

    const data = loadEconomy();
    const amount = Math.floor(Math.random() * 5) + 1;
    addBalance(data, message.author.id, amount);
    saveEconomy(data, client);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    const timeLeft = checkAndApplyCooldown(command, interaction.user.id);
    if (timeLeft > 0) {
        return interaction.reply({ content: `Please wait **${timeLeft.toFixed(1)}s** before using this command again.`, ephemeral: true });
    }

    try {
        trackCommandUsage(interaction.user.id, command);
        await command.execute(client, interaction);
    } catch (error) {
        console.error(`[Command] Slash ${interaction.commandName} failed:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Unexpected error while running command.', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Unexpected error while running command.', ephemeral: true });
        }
        sendLog(client, 'error', {
            commandName: interaction.commandName,
            error,
            guildName: interaction.guild?.name,
            guildId: interaction.guild?.id
        });
    }
});

process.on('unhandledRejection', error => {
    console.error('[Global] Unhandled Rejection:', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Unhandled Rejection' });
});

process.on('uncaughtException', error => {
    console.error('[Global] Uncaught Exception:', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Uncaught Exception' });
});

client.login(token);
