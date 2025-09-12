const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../logger');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
const TRANSACTIONS_PATH = path.join(__dirname, '..', '..', 'transactions.json');

module.exports = {
    name: 'daily',
    description: 'Recebe moedas diariamente (a cada 24h).',

    async execute(message, args, client) {
        let economy = {};
        let transactions = {};

        if (fs.existsSync(ECONOMY_PATH))
            economy = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));

        if (fs.existsSync(TRANSACTIONS_PATH))
            transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, 'utf8'));

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

                return message.reply(
                    `⏳ Você já resgatou seu **daily** hoje! Tente novamente em **${hours}h ${minutes}m**.`
                );
            }
        }

        const amount = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

        economy[userId] = (economy[userId] || 0) + amount;

        transactions[userId].push({
            type: 'daily',
            amount,
            date: new Date().toISOString()
        });

        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economy, null, 2));
        fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2));

        // Log atualizado
        await sendLog(client, "economy", {
            userId,
            amount: economy[userId],
            received: amount
        });

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🎁 Daily Rewards')
            .setDescription(`Você recebeu **${amount} moedas** hoje!`)
            .setFooter({ text: 'Volte amanhã para mais recompensas.' });

        message.reply({ embeds: [embed] });
    }
};
