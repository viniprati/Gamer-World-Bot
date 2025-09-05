const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente admins).',
    async execute(message, args, client) {
        // Verifica se o usuário tem permissão de admin
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para adicionar moedas.');
        if (!amount || amount <= 0) return message.reply('Digite um valor válido.');

        const filePath = path.join(__dirname, '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!data[target.id]) data[target.id] = 0;
        data[target.id] += amount;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        message.reply(`✅ Adicionadas ${amount} moedas para ${target.user.tag}.`);
    },
};
