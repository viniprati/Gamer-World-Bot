// CÓDIGO CORRIGIDO PARA: commands/basic/give.js

const fs = require('fs');
const path = require('path');
// CORREÇÃO: O caminho sobe dois níveis para encontrar o logger.js na raiz.
const { sendLog } = require('../../logger.js');

module.exports = {
    name: 'give',
    description: 'Transfere moedas para outro usuário.',
    async execute(message, args, client) {
        const target = message.mentions.members.first();
        const amount = parseInt(args[1], 10);

        if (!target) return message.reply('Mencione o usuário para transferir moedas. Ex: `!give @alguem 100`');
        if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido e positivo.');
        if (target.id === message.author.id) return message.reply('Você não pode transferir moedas para si mesmo.');

        // CORREÇÃO: O caminho sobe dois níveis para encontrar o economy.json na raiz.
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const authorId = message.author.id;
        const targetId = target.id;

        if ((data[authorId] || 0) < amount) {
            return message.reply('Você não tem moedas suficientes.');
        }

        data[authorId] -= amount;
        data[targetId] = (data[targetId] || 0) + amount;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

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