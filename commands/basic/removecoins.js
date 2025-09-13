const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    name: 'removecoins',
    description: 'Remove moedas de um usuário (somente pessoas autorizadas).',
    cooldown: 5, 
    async execute(message, args, client) {
        const allowedUsers = ['1077723832036630528', '983870132063453235', '820041555443449856', '1109255544495145021'];
        if (!allowedUsers.includes(message.author.id)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amountToRemove = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para remover moedas.');
        if (isNaN(amountToRemove) || amountToRemove <= 0) return message.reply('Digite um valor válido.');

        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const targetId = target.id;
        const userData = economyData[targetId];

        // A LÓGICA INTELIGENTE E DEFINITIVA
        // Garante que 'currentBalance' será sempre um número.
        const currentBalance = (userData && userData.balance) || userData || 0;

        // A matemática agora é segura e impede saldo negativo.
        const newBalance = Math.max(0, currentBalance - amountToRemove);
        const amountActuallyRemoved = currentBalance - newBalance;

        // Salva sempre como um número simples.
        economyData[targetId] = newBalance;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        await sendLog(client, "economy", { 
            userId: targetId, 
            action: `Moedas removidas por Staff (${message.author.tag})`,
            amount: amountActuallyRemoved, 
            newBalance: newBalance
        });

        const fmt = (n) => n.toLocaleString('pt-BR');
        message.reply(`✅ Removidas **${fmt(amountActuallyRemoved)} moedas** de ${target.user.tag}. Agora ele tem **${fmt(newBalance)} moedas**.`);
    },
};