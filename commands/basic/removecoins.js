const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'removecoins',
    description: 'Remove moedas de um usuário (somente admins).',
    async execute(message, args, client) {
        // Verifica se o usuário tem permissão de admin
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para remover moedas.');
        if (!amount || amount <= 0) return message.reply('Digite um valor válido.');

        const filePath = path.join(__dirname, '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!data[target.id]) data[target.id] = 0;

        // Evita saldo negativo
        data[target.id] -= amount;
        if (data[target.id] < 0) data[target.id] = 0;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        message.reply(`✅ Removidas ${amount} moedas de ${target.user.tag}.`);
    },
};
