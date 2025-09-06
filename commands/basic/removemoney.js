const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'removemoney',
    description: 'Remove moedas de um usuário (somente administradores).',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1], 10);
        if (!target) return message.reply('Mencione o usuário. Ex: `!removemoney @user 50`');
        if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido (número inteiro positivo).');

        const filePath = path.join(__dirname, '../../economy.json'); // sobe até a raiz
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!data[target.id]) data[target.id] = 0;
        data[target.id] = Math.max(0, data[target.id] - amount);

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        return message.reply(`✅ Removido 💰 **${amount.toLocaleString('pt-BR')}** de **${target.user.tag}**. Novo saldo: **${data[target.id].toLocaleString('pt-BR')}**.`);
    },
};
