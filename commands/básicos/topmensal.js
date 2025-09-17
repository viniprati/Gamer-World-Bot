const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// Emojis para o pódio
const EMOJI_GOLD = '🥇';
const EMOJI_SILVER = '🥈';
const EMOJI_BRONZE = '🥉';
const EMOJI_DEFAULT = '⭐';

// Função para carregar os dados de uso de forma segura
function loadUsageData(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        return rawData ? JSON.parse(rawData) : {};
    } catch (error) {
        console.error("Erro ao ler ou parsear command_usage.json:", error);
        return {}; // Retorna um objeto vazio em caso de erro
    }
}

module.exports = {
    name: 'topmensal',
    aliases: ['topm', 'rankmensal'],
    description: 'Mostra os 10 usuários mais ativos do mês (por uso de comandos).',
    cooldown: 30,
    async execute(message, args, client) {
        const usageFilePath = path.join(__dirname, '..', '..', 'command_usage.json');
        const usageData = loadUsageData(usageFilePath);
        
        const currentMonth = new Date().toISOString().slice(0, 7); // Formato "YYYY-MM"
        const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

        // Filtra para pegar apenas os usuários ativos neste mês e ordena
        const sorted = Object.entries(usageData)
            .filter(([, data]) => data.lastMonth === currentMonth && data.monthlyCount > 0)
            .sort(([, a], [, b]) => b.monthlyCount - a.monthlyCount);

        if (sorted.length === 0) {
            return message.reply('Ninguém usou comandos ainda este mês. Seja o primeiro a aparecer no ranking!');
        }

        const top10 = sorted.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle(`🏆 Top 10 Jogadores Ativos - ${currentMonthName}`)
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: `Ranking de uso de comandos` });

        // Busca todos os usuários de uma vez para ser mais eficiente
        const userPromises = top10.map(([userId]) => client.users.fetch(userId).catch(() => null));
        const users = await Promise.all(userPromises);

        let description = '';
        for (let i = 0; i < top10.length; i++) {
            const [userId, data] = top10[i];
            const user = users[i];
            const username = user ? user.tag : `Usuário Desconhecido (${userId.slice(-4)})`;

            let medal = EMOJI_DEFAULT;
            if (i === 0) medal = EMOJI_GOLD;
            else if (i === 1) medal = EMOJI_SILVER;
            else if (i === 2) medal = EMOJI_BRONZE;

            description += `${medal} **${i + 1}.** ${username} - **${data.monthlyCount}** comandos\n`;
        }
        
        embed.setDescription(description);

        // Mostra a posição do autor do comando
        const authorRank = sorted.findIndex(([userId]) => userId === message.author.id);
        if (authorRank !== -1) {
            const authorData = sorted[authorRank][1];
            embed.addFields({
                name: '🎯 Sua Atividade',
                value: `Você está em **${authorRank + 1}º lugar** com **${authorData.monthlyCount}** comandos este mês.`,
            });
        }

        await message.channel.send({ embeds: [embed] });
    },
};