const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'uptime',
    description: 'Mostra há quanto tempo o bot está online.',
    async execute(message, args, client) {
        let totalSeconds = (client.uptime / 1000);
        let days = Math.floor(totalSeconds / 86400);
        totalSeconds %= 86400;
        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = Math.floor(totalSeconds % 60);

        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        const embed = new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('⏱ Uptime do Bot')
            .setDescription(`O bot está online há: **${uptime}**`)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    },
};
