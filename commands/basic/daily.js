const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'daily',
    description: 'Recebe moedas diariamente (a cada 24h).',
    async execute(message, args, client) {
        const economyPath = path.join(__dirname, '..', '..', 'economy.json');
        const transactionsPath = path.join(__dirname, '..', '..', 'transactions.json');

        let economy = {};
        let transactions = {};

        if (fs.existsSync(economyPath)) economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
        if (fs.existsSync(transactionsPath)) transactions = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));

        const userId = message.author.id;

        if (!transactions[userId]) transactions[userId] = [];

        const lastDaily = transactions[userId]
            .filter(t => t.type === 'daily')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (lastDaily) {
            const lastClaim = new Date(lastDaily.date);
            const now = new Date();
            const diff = now - lastClaim;

            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor((24 * 60 * 60 * 1000 - diff) / (1000 * 60 * 60));
                const minutes = Math.floor(((24 * 60 * 60 * 1000 - diff) % (1000 * 60 * 60)) / (1000 * 60));

                return message.reply(`⏳ Você já resgatou seu **daily** hoje! Tente novamente em **${hours}h ${minutes}m**.`);
            }
        }

        const amount = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

        economy[userId] = (economy[userId] || 0) + amount;

        transactions[userId].push({
            type: 'daily',
            amount,
            date: new Date().toISOString()
        });

        fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
        fs.writeFileSync(transactionsPath, JSON.stringify(transactions, null, 2));

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🎁 Daily Rewards')
            .setDescription(`Você recebeu **${amount} moedas** hoje!`)
            .setFooter({ text: 'Volte amanhã para mais recompensas.' });

        message.reply({ embeds: [embed] });
    }
};
