const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { loadEconomy, sortRanking } = require('../../utils/economyManager');

const USERS_PER_PAGE = 10;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Mostra o ranking de moedas do servidor.'),

    name: 'leaderboard',
    aliases: ['top', 'rank'],
    description: 'Mostra o ranking de moedas do servidor.',
    cooldown: 20,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = interactionOrMessage.guild;
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);

        const sorted = sortRanking(loadEconomy()).filter(([, balance]) => balance > 0);
        if (sorted.length === 0) return reply('Ainda nao ha usuarios com moedas no ranking.');

        let currentPage = 0;
        const totalPages = Math.ceil(sorted.length / USERS_PER_PAGE);

        const generateEmbed = async page => {
            const start = page * USERS_PER_PAGE;
            const users = sorted.slice(start, start + USERS_PER_PAGE);
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`Ranking de Moedas - ${guild.name}`)
                .setFooter({ text: `Pagina ${page + 1} de ${totalPages}` });

            const fields = [];
            for (let i = 0; i < users.length; i++) {
                const rank = start + i + 1;
                const [userId, balance] = users[i];
                const user = client.users.cache.get(userId) || await client.users.fetch(userId).catch(() => null);
                fields.push({
                    name: `${rank}. ${user ? user.username : 'Usuario Desconhecido'}`,
                    value: `${balance.toLocaleString('pt-BR')} moedas`,
                    inline: false
                });
            }
            embed.addFields(fields);
            return embed;
        };

        const buttonsFor = page => new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev_page').setLabel('Anterior').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('next_page').setLabel('Proximo').setStyle(ButtonStyle.Primary).setDisabled(page >= totalPages - 1)
        );

        const response = await reply({
            embeds: [await generateEmbed(currentPage)],
            components: totalPages > 1 ? [buttonsFor(currentPage)] : []
        });

        const message = isSlash ? await interactionOrMessage.fetchReply() : response;
        const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });

        collector.on('collect', async interaction => {
            if (interaction.user.id !== author.id) {
                return interaction.reply({ content: 'Voce nao pode controlar este menu.', ephemeral: true });
            }

            if (interaction.customId === 'prev_page' && currentPage > 0) currentPage--;
            if (interaction.customId === 'next_page' && currentPage < totalPages - 1) currentPage++;

            await interaction.update({
                embeds: [await generateEmbed(currentPage)],
                components: [buttonsFor(currentPage)]
            });
        });

        collector.on('end', () => {
            message.edit({ components: [] }).catch(() => {});
        });
    },
};
