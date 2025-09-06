const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'balance',
    description: 'Mostra seu saldo de moedas e posição no ranking.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const userId = message.author.id;
        const balance = data[userId] || 0;

        const ranking = Object.entries(data)
            .sort((a, b) => b[1] - a[1]) // maior saldo primeiro
            .map(([id]) => id);

        const position = ranking.indexOf(userId) + 1;

        message.reply(
            `🎮 Você tem ${balance} moedas.\n🏆 Sua posição no ranking é: ${position}º lugar.`
        );
    },
};
