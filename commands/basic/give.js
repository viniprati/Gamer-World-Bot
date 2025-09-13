const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    name: 'give',
    description: 'Transfere moedas para outro usuário.',
    // ADICIONADO: Cooldown para prevenir spam de transferências
    cooldown: 15, 
    async execute(message, args, client) {
        const target = message.mentions.members.first();
        const amount = parseInt(args[1], 10);

        if (!target) return message.reply('Mencione o usuário para transferir moedas. Ex: `!give @alguem 100`');
        if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido e positivo.');
        if (target.id === message.author.id) return message.reply('Você não pode transferir moedas para si mesmo.');

        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const authorId = message.author.id;
        const targetId = target.id;

        const authorBalance = economyData[authorId] || 0;

        if (authorBalance < amount) {
            return message.reply('Você não tem moedas suficientes.');
        }

        const targetBalance = economyData[targetId] || 0;

        // Lógica de transferência com números
        economyData[authorId] = authorBalance - amount;
        economyData[targetId] = targetBalance + amount;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        // Envia o log da transação
        await sendLog(client, 'transaction', {
            fromId: authorId,
            toId: targetId,
            amount: amount
        });

        const fmt = (n) => n.toLocaleString('pt-BR');
        return message.reply(`✅ Você enviou 💰 **${fmt(amount)}** moedas para **${target.user.tag}**.`);
    },
};