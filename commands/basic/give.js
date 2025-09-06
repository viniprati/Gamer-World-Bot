const fs = require('fs');
const path = require('path');
const { PermissionsBitField } = require('discord.js');

function getData(filePath) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function formatNumber(num) {
    return num.toLocaleString('pt-BR');
}

module.exports = [
    {
        name: 'addmoney',
        description: 'Adiciona moedas a um usuário (somente administradores).',
        async execute(message, args, client) {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Você não tem permissão para usar este comando.');
            }

            const target = message.mentions.members.first();
            const amount = parseInt(args[1], 10);
            if (!target) return message.reply('Mencione o usuário para adicionar moedas. Ex: `!addmoney @user 100`');
            if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido (número inteiro positivo).');

            const filePath = path.join(__dirname, '../../economy.json');
            const data = getData(filePath);

            if (!data[target.id]) data[target.id] = 0;
            data[target.id] += amount;

            saveData(filePath, data);

            return message.reply(`✅ Adicionado 💰 **${formatNumber(amount)}** moedas para **${target.user.tag}**. Novo saldo: **${formatNumber(data[target.id])}**.`);
        },
    },
    {
        name: 'removemoney',
        description: 'Remove moedas de um usuário (somente administradores).',
        async execute(message, args, client) {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('❌ Você não tem permissão para usar este comando.');
            }

            const target = message.mentions.members.first();
            const amount = parseInt(args[1], 10);
            if (!target) return message.reply('Mencione o usuário para remover moedas. Ex: `!removemoney @user 50`');
            if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido (número inteiro positivo).');

            const filePath = path.join(__dirname, '../../economy.json');
            const data = getData(filePath);

            if (!data[target.id]) data[target.id] = 0;
            data[target.id] = Math.max(0, data[target.id] - amount);

            saveData(filePath, data);

            return message.reply(`✅ Removido 💰 **${formatNumber(amount)}** moedas de **${target.user.tag}**. Novo saldo: **${formatNumber(data[target.id])}**.`);
        },
    }
];
