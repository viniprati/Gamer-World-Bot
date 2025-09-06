const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'give',
    description: 'Transfere moedas para outro usuário.',
    async execute(message, args, client) {
        // Uso: !give @alvo 100
        const target = message.mentions.members.first();
        const amount = parseInt(args[1], 10);

        if (!target) return message.reply('Mencione o usuário para transferir moedas. Ex: `!give @alguem 100`');
        if (isNaN(amount) || amount <= 0) return message.reply('Informe um valor válido (número inteiro positivo).');
        if (target.id === message.author.id) return message.reply('Você não pode transferir moedas para si mesmo.');

        // economy.json fica na RAIZ do projeto
        const filePath = path.join(__dirname, '../../economy.json');
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}, null, 2));

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const authorId = message.author.id;
        const targetId = target.id;

        if (!data[authorId] || data[authorId] < amount) {
            return message.reply('Você não tem moedas suficientes.');
        }
        if (!data[targetId]) data[targetId] = 0;

        // transfere
        data[authorId] -= amount;
        data[targetId] += amount;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        // use o mesmo texto/emoji do seu balance (ajuste aqui se usa 🎮/xpgames)
        const fmt = (n) => n.toLocaleString('pt-BR');
        return message.reply(`✅ Você enviou 💰 **${fmt(amount)}** moedas para **${target.user.tag}**.`);
    },
};
