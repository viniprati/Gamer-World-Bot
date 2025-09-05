const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'balance',
    description: 'Mostra seu saldo de moedas.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json'); // sobe 2 níveis
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const userId = message.author.id;
        const balance = data[userId] || 0;

        message.reply(`🎮 Você tem ${balance} moedas.`);
    },
};
