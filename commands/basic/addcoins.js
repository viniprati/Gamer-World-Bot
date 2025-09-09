const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente pessoas autorizadas).',
    async execute(message, args, client) {
        // IDs autorizados
        const allowedUsers = [
            '1077723832036630528', // Dago
            '983870132063453235', // Prati (dono)
            '820041555443449856', // Gb
            '1109255544495145021' // Prince
        ];

        if (!allowedUsers.includes(message.author.id)) {
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

        message.reply(
            `✅ Adicionadas **${amount} moedas** para ${target.user.tag}. Agora ele tem **${data[target.id]} moedas**.`
        );
    },
};
