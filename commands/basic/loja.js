const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'buy',
    description: 'Compre um VIP usando suas moedas.',
    async execute(message, args, client) {
        if (!args[0]) return message.reply('Use: `!buy <prata | ouro | diamante>`');

        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) {
            data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }

        const userId = message.author.id;
        if (!data[userId]) data[userId] = 0;

        const vipRoles = {
            prata: { id: '1389915201641512960', price: 80000, name: '🥈 VIP Prata' },
            ouro: { id: '1389915441157115934', price: 120000, name: '🥇 VIP Ouro' },
            diamante: { id: '1389915552084004884', price: 200000, name: '💎 VIP Diamante' }
        };

        const choice = args[0].toLowerCase();
        const vip = vipRoles[choice];
        if (!vip) return message.reply('VIP inválido! Use: `prata`, `ouro` ou `diamante`.');

        if (data[userId] < vip.price) {
            return message.reply(`Você não tem moedas suficientes! Precisa de **${vip.price}** moedas para comprar ${vip.name}.`);
        }

        data[userId] -= vip.price;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        const role = message.guild.roles.cache.get(vip.id);
        if (!role) return message.reply('Cargo VIP não encontrado no servidor.');

        const member = message.guild.members.cache.get(userId);
        await member.roles.add(role);

        message.reply(`Parabéns! Você comprou o cargo ${vip.name} por **${vip.price} moedas** 🎉`);
    },
};
