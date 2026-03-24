const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { loadEconomy, getBalance, sortRanking } = require('../../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Mostra o saldo de moedas de um usuario.')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario alvo (opcional).').setRequired(false)),

    name: 'balance',
    aliases: ['bal', 'atm', 'carteira', 'ba'],
    description: 'Mostra o saldo de moedas de um usuario.',
    cooldown: 5,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const target = isSlash
            ? (interactionOrMessage.options.getMember('usuario') || interactionOrMessage.member)
            : (interactionOrMessage.mentions.members.first() || interactionOrMessage.member);
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        const economy = loadEconomy();
        const balance = getBalance(economy, target.id);
        const ranking = sortRanking(economy).map(([userId]) => userId);
        const position = ranking.indexOf(target.id) + 1;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: `Carteira de ${target.user.username}`, iconURL: target.user.displayAvatarURL() })
            .addFields(
                { name: 'Moedas', value: balance.toLocaleString('pt-BR'), inline: true },
                { name: 'Ranking', value: position > 0 ? `${position}o lugar` : 'Nao ranqueado', inline: true }
            );

        return reply({ embeds: [embed] });
    },
};
