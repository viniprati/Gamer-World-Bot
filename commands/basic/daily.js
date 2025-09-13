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
        if (fs.existsSync(ECONOMY_PATH)) {
            economy = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        let transactions = {};
        if (fs.existsSync(TRANSACTIONS_PATH)) {
            transactions = JSON.parse(fs.readFileSync(TRANSACTIONS_PATH, 'utf8'));
        }

        const userId = message.author.id;
        const now = new Date();

        if (!transactions[userId]) transactions[userId] = [];

        const lastDaily = transactions[userId]
            .filter(t => t.type === 'daily')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (lastDaily) {
            const lastClaimTime = new Date(lastDaily.date).getTime();
            const cooldown = 24 * 60 * 60 * 1000;
            const timePassed = now.getTime() - lastClaimTime;

            if (timePassed < cooldown) {
                const timeLeft = cooldown - timePassed;
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                return message.reply(`⏳ Você já resgatou seu **daily**! Tente novamente em **${hours}h ${minutes}m**.`);
            }
        }

        const amountReceived = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
        const currentBalance = economy[userId]?.balance || economy[userId] || 0;
        const newBalance = currentBalance + amountReceived;

        if (!economy[userId] || typeof economy[userId] !== 'object') {
            economy[userId] = {};
        }
        economy[userId].balance = newBalance;
        
        transactions[userId].push({ type: 'daily', amount: amountReceived, date: now.toISOString() });

        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economy, null, 2));
        fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2));

        // ALTERADO: Agora chama o log do tipo 'daily' com os dados corretos
        await sendLog(client, "daily", {
            userId: userId,
            amount: amountReceived,
            newBalance: newBalance
        });

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🎁 Daily Resgatado!')
            .setDescription(`Você recebeu **${amountReceived.toLocaleString('pt-BR')} moedas**!`)
            .addFields({ name: '💰 Saldo Atual', value: `${newBalance.toLocaleString('pt-BR')} moedas` })
            .setFooter({ text: 'Volte amanhã para mais recompensas.' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};