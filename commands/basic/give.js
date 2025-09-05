const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'give',
    description: 'Transfere moedas para outro usuário.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para transferir moedas.');
        if (!amount || amount <= 0) return message.reply('Digite um valor válido.');
        if (!data[message.author.id] || data[message.author.id] < amount) return message.reply('Você não tem moedas suficientes.');

        if (!data[target.id]) data[target.id] = 0;

        data[message.author.id] -= amount;
        data[target.id] += amount;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        message.reply(`✅ Você enviou ${amount} moedas para ${target.user.tag}.`);
    },
};
