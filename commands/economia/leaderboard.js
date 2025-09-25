const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const EMOJI_GOLD = '<a:ouro:1415671965431107717>';
const EMOJI_SILVER = '<a:prata:1415671969071894631>';
const EMOJI_BRONZE = '<a:bronze:1415671967088119840>';
const USERS_PER_PAGE = 10;

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Mostra o ranking de moedas do servidor com páginas interativas.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'leaderboard',
    aliases: ['top', 'rank'],
    description: 'Mostra o ranking de moedas do servidor com páginas interativas.',
    cooldown: 20,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        const channel = isSlash ? interactionOrMessage.channel : interactionOrMessage.channel;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : channel.send(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        if (!fs.existsSync(filePath)) return reply('Nenhum dado de economia foi encontrado para gerar o ranking.');

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const sorted = Object.entries(data)
            .filter(([, userData]) => (userData?.balance || userData || 0) > 0)
            .sort(([, a], [, b]) => (b?.balance || b || 0) - (a?.balance || a || 0));

        if (sorted.length === 0) {
            return reply('Ainda não há usuários com moedas para exibir no ranking.');
        }

        let currentPage = 0;
        const totalPages = Math.ceil(sorted.length / USERS_PER_PAGE);

        const generateEmbed = async (page) => {
            const start = page * USERS_PER_PAGE;
            const end = start + USERS_PER_PAGE;
            const topUsers = sorted.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 Ranking de Moedas - ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ text: `Página ${page + 1} de ${totalPages}` });

            const fields = [];
            for (let i = 0; i < topUsers.length; i++) {
                const rank = start + i + 1;
                const [userId, userData] = topUsers[i];
                const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
                const username = user ? user.username : 'Usuário Desconhecido';
                const balance = userData?.balance || userData || 0;

                let medal = rank === 1 ? EMOJI_GOLD : rank === 2 ? EMOJI_SILVER : rank === 3 ? EMOJI_BRONZE : `**${rank}.**`;
                fields.push({ name: `${medal} ${username}`, value: `💰 **${balance.toLocaleString('pt-BR')}** moedas`, inline: false });
            }
            
            embed.addFields(fields);
            
            const authorRank = sorted.findIndex(([userId]) => userId === author.id);
            if (authorRank !== -1) {
                const authorData = sorted[authorRank][1];
                const authorBalance = authorData?.balance || authorData || 0;
                embed.addFields({ name: '\u200B', value: `🎯 **Sua Posição:** Você está em **${authorRank + 1}º lugar** com **${authorBalance.toLocaleString('pt-BR')}** moedas.` });
            }

            return embed;
        };

        const generateButtons = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_page').setLabel('◀️ Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next_page').setLabel('Próximo ▶️').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1)
            );
        };

        const initialEmbed = await generateEmbed(currentPage);
        const initialButtons = generateButtons(currentPage);
        
        // Usa a função de resposta unificada para enviar a mensagem inicial
        const response = await reply({
            embeds: [initialEmbed],
            components: totalPages > 1 ? [initialButtons] : [] // Só mostra botões se houver mais de uma página
        });

        // O coletor funciona da mesma forma, mas pegamos a mensagem de resposta de uma maneira segura
        const message = isSlash ? await interactionOrMessage.fetchReply() : response;

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutos
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== author.id) {
                return interaction.reply({ content: 'Você não pode controlar este menu.', ephemeral: true });
            }

            if (interaction.customId === 'prev_page' && currentPage > 0) {
                currentPage--;
            } else if (interaction.customId === 'next_page' && currentPage < totalPages - 1) {
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
            message.edit({ components: [] }).catch(() => {});
        });
    },
};