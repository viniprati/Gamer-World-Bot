const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');
const { scheduleReminder } = require('../../utils/reminderManager');
const { loadEconomy, saveEconomy, getBalance, setBalance } = require('../../utils/economyManager');

const TRANSACTIONS_PATH = path.join(__dirname, '..', '..', 'transactions.json');
const PREMIUM_PATH = path.join(__dirname, '..', '..', 'premium.json');

function loadJsonSafe(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveJsonSafe(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getPremiumUsers() {
    const data = loadJsonSafe(PREMIUM_PATH, { users: [] });
    return Array.isArray(data.users) ? data.users : [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Resgate sua recompensa diaria.'),

    name: 'daily',
    description: 'Recebe moedas diariamente.',
    cooldown: 10,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const user = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const reply = options => {
            const finalOptions = typeof options === 'string' ? { content: options } : options;
            if (!isSlash) finalOptions.allowedMentions = { repliedUser: false };
            return isSlash ? interactionOrMessage.reply(finalOptions) : interactionOrMessage.reply(finalOptions);
        };

        const userId = user.id;
        const now = Date.now();
        const isPremium = getPremiumUsers().includes(userId);

        let cooldownDuration = 24 * 60 * 60 * 1000;
        if (isPremium) cooldownDuration *= 0.9;

        const transactions = loadJsonSafe(TRANSACTIONS_PATH, {});
        if (!Array.isArray(transactions[userId])) transactions[userId] = [];

        const lastDaily = transactions[userId]
            .filter(t => t.type === 'daily')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (lastDaily) {
            const elapsed = now - new Date(lastDaily.date).getTime();
            if (elapsed < cooldownDuration) {
                const left = cooldownDuration - elapsed;
                const h = Math.floor(left / (1000 * 60 * 60));
                const m = Math.floor((left % (1000 * 60 * 60)) / (1000 * 60));
                return reply(`Voce ja resgatou seu daily. Tente novamente em **${h}h ${m}m**.`);
            }
        }

        let amountReceived = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
        if (isPremium) amountReceived *= 2;

        const economy = loadEconomy();
        const newBalance = getBalance(economy, userId) + amountReceived;
        setBalance(economy, userId, newBalance);
        saveEconomy(economy, client);

        transactions[userId].push({ type: 'daily', amount: amountReceived, date: new Date(now).toISOString() });
        saveJsonSafe(TRANSACTIONS_PATH, transactions);

        scheduleReminder(userId, 'daily', cooldownDuration);

        await sendLog(client, 'daily', {
            userId,
            amount: amountReceived,
            newBalance
        });

        const embed = new EmbedBuilder()
            .setColor(isPremium ? '#FFD700' : '#2ECC71')
            .setTitle('Daily resgatado')
            .setDescription(`Voce recebeu **${amountReceived.toLocaleString('pt-BR')} moedas**.`)
            .addFields({ name: 'Saldo atual', value: newBalance.toLocaleString('pt-BR') });

        return reply({ embeds: [embed] });
    }
};
