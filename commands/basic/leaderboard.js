const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// CORRIGIDO: Agora usamos a string completa com o ID do emoji
const EMOJI_GOLD = '<:ouro:1415671965431107717>';
const EMOJI_SILVER = '<:prata:1415671969071894631>';
const EMOJI_BRONZE = '<:bronze:1415671967088119840>';

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'rank'],
    description: 'Mostra os usuários com mais moedas.',
    cooldown: 20,
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) return message.reply('Nenhum dado de economia foi encontrado para gerar o ranking.');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const sorted = Object.entries(data)
            .filter(([, userData]) => (userData?.balance || userData || 0) > 0)
            .sort(([, a], [, b]) => (b?.balance || b || 0) - (a?.balance || a || 0));

        if (sorted.length === 0) {
            return message.reply('Ainda não há usuários com moedas para exibir no ranking.');
        }

        const top10 = sorted.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`🏆 Ranking de Moedas - ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Solicitado por: ${message.author.tag}` });

        const topUsersFields = [];
        for (let i = 0; i < top10.length; i++) {
            const [userId, userData] = top10[i];
            const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
            const username = user ? user.username : `Usuário Desconhecido`;
            
            const balance = userData?.balance || userData || 0;

            let medal = '';
            if (i === 0) medal = EMOJI_GOLD;
            else if (i === 1) medal = EMOJI_SILVER;
            else if (i === 2) medal = EMOJI_BRONZE;
            else medal = `**${i + 1}.**`;

            topUsersFields.push({
                name: `${medal} ${username}`,
                value: `💰 **${balance.toLocaleString('pt-BR')}** moedas`,
                inline: false,
            });
        }
        
        embed.addFields(topUsersFields);

        const authorRank = sorted.findIndex(([userId]) => userId === message.author.id);

        if (authorRank !== -1) {
            const authorData = sorted[authorRank][1];
            const authorBalance = authorData?.balance || authorData || 0;
            
            embed.addFields({ name: '\u200B', value: '\u200B' }); 
            
            embed.addFields({
                name: '🎯 Sua Posição',
                value: `Você está em **${authorRank + 1}º lugar** com **${authorBalance.toLocaleString('pt-BR')}** moedas.`,
                inline: false,
            });
        }
        
        message.channel.send({ embeds: [embed] });
    },
};