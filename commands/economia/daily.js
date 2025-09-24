const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../logger');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
const TRANSACTIONS_PATH = path.join(__dirname, '..', '..', 'transactions.json');
const PREMIUM_PATH = path.join(__dirname, '..', '..', 'premium.json');

const getPremiumUsers = () => {
    try {
        if (!fs.existsSync(PREMIUM_PATH)) return { users: [] };
        const data = fs.readFileSync(PREMIUM_PATH, 'utf8');
        const parsed = JSON.parse(data);
        return (parsed && Array.isArray(parsed.users)) ? parsed : { users: [] };
    } catch (error) {
        console.error("Erro ao ler premium.json:", error);
        return { users: [] };
    }
};

module.exports = {
    name: 'daily',
    description: 'Recebe moedas diariamente.',
    cooldown: 10,
    // ================== A CORREÇÃO ESTÁ AQUI ==================
    // A ordem dos parâmetros foi corrigida para (client, message, args)
    async execute(client, message, args) {
    // ==========================================================
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

        const premiumData = getPremiumUsers();
        const isPremium = premiumData.users.includes(userId);

        if (!transactions[userId]) transactions[userId] = [];

        const lastDaily = transactions[userId]
            .filter(t => t.type === 'daily')
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (lastDaily) {
            const lastClaimTime = new Date(lastDaily.date).getTime();
            let cooldown = 24 * 60 * 60 * 1000;
            if (isPremium) {
                cooldown *= 0.90;
            }

            const timePassed = now.getTime() - lastClaimTime;

            if (timePassed < cooldown) {
                const timeLeft = cooldown - timePassed;
                const hours = Math.floor(timeLeft / (1000 * 60 * 60));
                const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                return message.reply(`⏳ Você já resgatou seu **daily**! Tente novamente em **${hours}h ${minutes}m**.`);
            }
        }

        let amountReceived = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
        if (isPremium) {
            amountReceived *= 2;
        }
        
        const userData = economy[userId];
        const currentBalance = (userData && userData.balance) || userData || 0;
        const newBalance = currentBalance + amountReceived;

        economy[userId] = newBalance;
        transactions[userId].push({ type: 'daily', amount: amountReceived, date: now.toISOString() });

        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economy, null, 2));
        fs.writeFileSync(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2));

        await sendLog(client, "daily", {
            userId: userId,
            amount: amountReceived,
            newBalance: newBalance
        });

        const embed = new EmbedBuilder()
            .setColor(isPremium ? '#FFD700' : 'Green')
            .setTitle('🎁 Daily Resgatado!')
            .setDescription(`Você recebeu **${amountReceived.toLocaleString('pt-BR')} moedas**!`)
            .addFields({ name: '💰 Saldo Atual', value: `${newBalance.toLocaleString('pt-BR')} moedas` })
            .setFooter({ text: isPremium ? '✨ Bônus Premium Ativado!' : 'Volte amanhã para mais recompensas.' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }
};