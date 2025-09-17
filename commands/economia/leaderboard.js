const fs = require('fs');
const path = require('path');
// ADICIONADO: ActionRowBuilder e ButtonBuilder para criar os botões
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const EMOJI_GOLD = '<a:ouro:1415671965431107717>';
const EMOJI_SILVER = '<a:prata:1415671969071894631>';
const EMOJI_BRONZE = '<a:bronze:1415671967088119840>';

const USERS_PER_PAGE = 10;

module.exports = {
    name: 'leaderboard',
    aliases: ['top', 'rank'],
    description: 'Mostra o ranking de moedas do servidor com páginas interativas.',
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

        let currentPage = 0;
        const totalPages = Math.ceil(sorted.length / USERS_PER_PAGE);

        // --- FUNÇÃO PARA GERAR O EMBED DE UMA PÁGINA ESPECÍFICA ---
        const generateEmbed = async (page) => {
            const start = page * USERS_PER_PAGE;
            const end = start + USERS_PER_PAGE;
            const topUsers = sorted.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 Ranking de Moedas - ${message.guild.name}`)
                .setThumbnail(message.guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Página ${page + 1} de ${totalPages}` });

            const fields = [];
            for (let i = 0; i < topUsers.length; i++) {
                const rank = start + i + 1;
                const [userId, userData] = topUsers[i];
                const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
                const username = user ? user.username : 'Usuário Desconhecido';
                const balance = userData?.balance || userData || 0;

                let medal = '';
                if (rank === 1) medal = EMOJI_GOLD;
                else if (rank === 2) medal = EMOJI_SILVER;
                else if (rank === 3) medal = EMOJI_BRONZE;
                else medal = `**${rank}.**`;

                fields.push({
                    name: `${medal} ${username}`,
                    value: `💰 **${balance.toLocaleString('pt-BR')}** moedas`,
                    inline: false,
                });
            }
            
            embed.addFields(fields);
            
            // Adiciona a posição do autor se ele não estiver na página atual
            const authorRank = sorted.findIndex(([userId]) => userId === message.author.id);
            if (authorRank !== -1) {
                const authorData = sorted[authorRank][1];
                const authorBalance = authorData?.balance || authorData || 0;
                embed.addFields({ name: '\u200B', value: `🎯 **Sua Posição:** Você está em **${authorRank + 1}º lugar** com **${authorBalance.toLocaleString('pt-BR')}** moedas.` });
            }

            return embed;
        };

        // --- FUNÇÃO PARA GERAR OS BOTÕES ---
        const generateButtons = (page) => {
            return new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('◀️ Anterior')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Próximo ▶️')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages - 1)
                );
        };

        // --- ENVIANDO A MENSAGEM INICIAL ---
        const initialEmbed = await generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);
        
        const response = await message.channel.send({
            embeds: [initialEmbed],
            components: [initialButtons]
        });

        // --- COLETOR DE INTERAÇÕES DOS BOTÕES ---
        const collector = response.createMessageComponentCollector({
            time: 5 * 60 * 1000 // O menu fica ativo por 5 minutos
        });

        collector.on('collect', async (interaction) => {
            // Garante que apenas o autor do comando pode usar os botões
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Você não pode controlar este menu.', ephemeral: true });
            }

            if (interaction.customId === 'prev_page') {
                currentPage--;
            } else if (interaction.customId === 'next_page') {
                currentPage++;
            }

            const newEmbed = await generateEmbed(currentPage);
            const newButtons = generateButtons(currentPage);

            await interaction.update({
                embeds: [newEmbed],
                components: [newButtons]
            });
        });

        collector.on('end', () => {
            // Remove os botões da mensagem quando o coletor expira
            response.edit({ components: [] }).catch(() => {});
        });
    },
};