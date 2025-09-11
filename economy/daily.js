const { EmbedBuilder } = require('discord.js');
const db = require('../../database');
const { sendLog } = require('../../logger');

module.exports = {
    name: 'daily',
    description: 'Recebe moedas diariamente (a cada 24h).',
    async execute(message, args, client) {
        const userId = message.author.id;

        // Pegar último daily
        const last = db.prepare(`
            SELECT * FROM transactions
            WHERE userId = ? AND type = 'daily'
            ORDER BY date DESC LIMIT 1
        `).get(userId);

        if (last) {
            const lastClaim = new Date(last.date);
            const now = new Date();
            const diff = now - lastClaim;
            if (diff < 24 * 60 * 60 * 1000) {
                const hours = Math.floor((24 * 60 * 60 * 1000 - diff) / (1000 * 60 * 60));
                const minutes = Math.floor(((24 * 60 * 60 * 1000 - diff) % (1000 * 60 * 60)) / (1000 * 60));
                return message.reply(`⏳ Você já resgatou seu **daily** hoje! Tente novamente em **${hours}h ${minutes}m**.`);
            }
        }

        // Definir valor
        const amount = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;

        // Atualizar economia
        const user = db.prepare(`SELECT * FROM economy WHERE userId = ?`).get(userId);
        if (user) {
            db.prepare(`UPDATE economy SET coins = coins + ? WHERE userId = ?`).run(amount, userId);
        } else {
            db.prepare(`INSERT INTO economy(userId, coins) VALUES(?, ?)`).run(userId, amount);
        }

        // Registrar transação
        db.prepare(`INSERT INTO transactions(userId, type, amount, date) VALUES(?, 'daily', ?, ?)`)
            .run(userId, amount, new Date().toISOString());

        // Pegar saldo atualizado
        const updated = db.prepare(`SELECT coins FROM economy WHERE userId = ?`).get(userId);

        // Log
        sendLog(client, "economy", { userId, amount: updated.coins, received: amount });

        // Resposta
        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('🎁 Daily Rewards')
            .setDescription(`Você recebeu **${amount} moedas** hoje!`)
            .setFooter({ text: 'Volte amanhã para mais recompensas.' });

        message.reply({ embeds: [embed] });
    }
};
