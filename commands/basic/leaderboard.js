const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    description: 'Mostra os usuários com mais moedas.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) return message.reply('Nenhum dado de moedas encontrado.');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) return message.reply('Não há usuários com moedas.');

        const top = sorted.slice(0, 10);

        let description = '';
        for (let i = 0; i < top.length; i++) {
            const user = await client.users.fetch(top[i][0]).catch(() => ({ tag: 'Usuário desconhecido' }));

            let medal = '💰';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';

            description += `${medal} **${i + 1}º** - ${user.tag} : ${top[i][1]} moedas\n`;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Top 10 Usuários com mais moedas')
            .setDescription(description)
            .setTimestamp()
            .setFooter({ text: 'Continue participando para subir no ranking!' });

        message.channel.send({ embeds: [embed] });
    },
};
