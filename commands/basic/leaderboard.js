const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'leaderboard',
    description: 'Mostra os usuários com mais moedas.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) return message.reply('Nenhum dado de moedas encontrado.');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Transforma em array e ordena do maior para o menor
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) return message.reply('Não há usuários com moedas.');

        // Pega top 10 ou menos se tiver menos usuários
        const top = sorted.slice(0, 10);

        // Monta mensagem
        let description = '';
        for (let i = 0; i < top.length; i++) {
            const user = await client.users.fetch(top[i][0]).catch(() => ({ tag: 'Usuário desconhecido' }));
            description += `**${i + 1}º** - ${user.tag} : 🎮 ${top[i][1]}\n`;
        }

        message.channel.send({
            content: '**🏆 Top 10 Usuários com mais moedas:**\n' + description
        });
    },
};
