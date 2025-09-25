const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Emojis para o pódio
const EMOJI_GOLD = '🥇';
const EMOJI_SILVER = '🥈';
const EMOJI_BRONZE = '🥉';
const EMOJI_DEFAULT = '⭐';

// Função para carregar os dados de uso de forma segura (sem alteração)
function loadUsageData(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        return rawData ? JSON.parse(rawData) : {};
    } catch (error) {
        console.error("Erro ao ler ou parsear command_usage.json:", error);
        return {};
    }
}

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('topmensal')
        .setDescription('Mostra os 10 usuários mais ativos do mês (por uso de comandos).'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'topmensal',
    aliases: ['topm', 'rankmensal'],
    description: 'Mostra os 10 usuários mais ativos do mês (por uso de comandos).',
    cooldown: 30,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        const usageFilePath = path.join(__dirname, '..', '..', 'command_usage.json');
        const usageData = loadUsageData(usageFilePath);
        
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

        const sorted = Object.entries(usageData)
            .filter(([, data]) => data.lastMonth === currentMonth && data.monthlyCount > 0)
            .sort(([, a], [, b]) => b.monthlyCount - a.monthlyCount);

        if (sorted.length === 0) {
            return reply('Ninguém usou comandos ainda este mês. Seja o primeiro a aparecer no ranking!');
        }

        const top10 = sorted.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle(`🏆 Top 10 Jogadores Ativos - ${currentMonthName}`)
            .setThumbnail(guild.iconURL({ dynamic: true })) // Alterado para usar a variável 'guild'
            .setTimestamp()
            .setFooter({ text: `Ranking de uso de comandos` });

        const userPromises = top10.map(([userId]) => client.users.fetch(userId).catch(() => null));
        const users = await Promise.all(userPromises);

        let description = '';
        for (let i = 0; i < top10.length; i++) {
            const [userId, data] = top10[i];
            const user = users[i];
            const username = user ? user.tag : `Usuário Desconhecido (${userId.slice(-4)})`;

            let medal = i === 0 ? EMOJI_GOLD : i === 1 ? EMOJI_SILVER : i === 2 ? EMOJI_BRONZE : EMOJI_DEFAULT;
            description += `${medal} **${i + 1}.** ${username} - **${data.monthlyCount}** comandos\n`;
        }
        
        embed.setDescription(description);

        const authorRank = sorted.findIndex(([userId]) => userId === author.id); // Alterado para usar a variável 'author'
        if (authorRank !== -1) {
            const authorData = sorted[authorRank][1];
            embed.addFields({
                name: '🎯 Sua Atividade',
                value: `Você está em **${authorRank + 1}º lugar** com **${authorData.monthlyCount}** comandos este mês.`,
            });
        }

        await reply({ embeds: [embed] }); // Alterado para usar a função de resposta unificada
    },
};