const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'Mostra informações sobre o servidor.',
    async execute(message, args, client) {
        if (!message.guild) {
            return message.reply('Este comando só pode ser usado em um servidor.');
        }

        const guild = message.guild;

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Informações do Servidor: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Nome do Servidor', value: guild.name, inline: true },
                { name: 'ID do Servidor', value: guild.id, inline: true },
                { name: 'Membros', value: guild.memberCount.toString(), inline: true },
                { name: 'Dono', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Criado em', value: guild.createdAt.toDateString(), inline: true },
                { name: 'Cargos', value: guild.roles.cache.size.toString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${message.author.tag}` });

        message.channel.send({ embeds: [embed] });
    },
};