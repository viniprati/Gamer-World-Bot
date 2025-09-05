const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'userinfo',
    description: 'Mostra informações sobre um usuário mencionado.',
    async execute(message, args, client) {
        const member = message.mentions.members.first() || message.member;

        if (!member) {
            return message.reply('Por favor, mencione um usuário ou forneça um ID de usuário.');
        }

        // Ordena cargos pela posição e remove @everyone
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString()) // isso menciona o cargo, mas não os usuários
            .join(', ') || 'Nenhum';

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Informações de Usuário: ${member.user.tag}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Nome de Usuário', value: member.user.username, inline: true },
                { name: 'ID do Usuário', value: member.user.id, inline: true },
                { name: 'Apelido (no servidor)', value: member.nickname || 'Nenhum', inline: true },
                { name: 'Entrou no Discord em', value: member.user.createdAt.toDateString(), inline: true },
                { name: 'Entrou no Servidor em', value: member.joinedAt ? member.joinedAt.toDateString() : 'N/A', inline: true },
                { name: 'Cargos', value: roles, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${message.author.tag}` });

        message.channel.send({ embeds: [embed] });
    },
};
