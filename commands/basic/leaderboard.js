const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'rank'],
    description: 'Mostra os usuários com mais moedas.',
    cooldown: 20,
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) return message.reply('Nenhum dado de economia foi encontrado para gerar o ranking.');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Lógica de ordenação inteligente que funciona com ambos os formatos
        const sorted = Object.entries(data)
            .filter(([, userData]) => {
                // Filtra usuários com saldo 0 ou inválido para não poluir o rank
                const balance = userData?.balance || userData || 0;
                return balance > 0;
            })
            .sort(([, a], [, b]) => {
                const balanceA = a?.balance || a || 0;
                const balanceB = b?.balance || b || 0;
                return balanceB - balanceA;
            });

        if (sorted.length === 0) {
            return message.reply('Ainda não há usuários com moedas para exibir no ranking.');
        }

        const top10 = sorted.slice(0, 10);

        // --- PREPARANDO O EMBED ---
        const embed = new EmbedBuilder()
            .setColor('#FFD700') // Dourado
            .setTitle(`🏆 Ranking de Moedas - ${message.guild.name}`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Solicitado por: ${message.author.tag}` });

        // --- GERANDO OS CAMPOS DO TOP 10 ---
        const topUsersFields = [];
        for (let i = 0; i < top10.length; i++) {
            const [userId, userData] = top10[i];
            // Tenta buscar o usuário no cache primeiro para ser mais rápido
            const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
            const username = user ? user.username : `Usuário Desconhecido`;
            
            const balance = userData?.balance || userData || 0;

            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `**${i + 1}.**`; // Posições 4-10

            topUsersFields.push({
                name: `${medal} ${username}`,
                value: `💰 **${balance.toLocaleString('pt-BR')}** moedas`,
                inline: false,
            });
        }
        
        embed.addFields(topUsersFields);

        // --- ENCONTRANDO A POSIÇÃO DE QUEM EXECUTOU O COMANDO ---
        const authorRank = sorted.findIndex(([userId]) => userId === message.author.id);

        if (authorRank !== -1) {
            const authorData = sorted[authorRank][1];
            const authorBalance = authorData?.balance || authorData || 0;
            
            // Adiciona um campo em branco para separar visualmente
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