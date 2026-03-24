const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBadges } = require('../../utils/badgeManager');
const { loadEconomy, getBalance, sortRanking } = require('../../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Mostra o perfil de um membro do servidor.')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario alvo (opcional).').setRequired(false)),

    name: 'userinfo',
    aliases: ['profile', 'perfil'],
    description: 'Mostra o perfil de um membro do servidor.',
    cooldown: 10,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const member = isSlash
            ? (interactionOrMessage.options.getMember('usuario') || interactionOrMessage.member)
            : (interactionOrMessage.mentions.members.first() || interactionOrMessage.member);
        const guild = interactionOrMessage.guild;
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);

        const user = await client.users.fetch(member.id, { force: true });
        const economy = loadEconomy();
        const balance = getBalance(economy, user.id);
        const ranking = sortRanking(economy).map(([id]) => id);
        const topRanking = ranking.indexOf(user.id) + 1;

        const roles = member.roles.cache
            .filter(role => role.id !== guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        let roleDisplay = roles.length > 0 ? roles.join(', ') : 'Nenhum cargo';
        if (roleDisplay.length > 1024) roleDisplay = `${roleDisplay.slice(0, 1020)}...`;

        const badges = getBadges(member, { balance }, topRanking);

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor === '#000000' ? '#5865F2' : member.displayHexColor)
            .setAuthor({ name: `Perfil: ${user.username}`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Usuario', value: `${user.tag}\n\`${user.id}\``, inline: true },
                { name: 'Economia', value: `GameCoins: ${balance.toLocaleString('pt-BR')}\nRank: #${topRanking > 0 ? topRanking : 'N/A'}`, inline: true },
                { name: `Cargos (${roles.length})`, value: roleDisplay, inline: false },
                { name: 'Insignias', value: badges, inline: false }
            )
            .setTimestamp();

        return reply({ embeds: [embed] });
    },
};
