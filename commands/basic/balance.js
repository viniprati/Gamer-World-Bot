const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'balance',
    description: 'Mostra seu saldo de moedas e posição no ranking.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const userId = message.author.id;
        const balance = data[userId] || 0;

        const ranking = Object.entries(data)
            .sort((a, b) => b[1] - a[1])
            .map(([id]) => id);

        const position = ranking.indexOf(userId) + 1;

        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle(`💰 Saldo de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Moedas', value: `🎮 ${balance}`, inline: true },
                { name: 'Ranking', value: `🏆 ${position}º lugar`, inline: true }
            )
            .setFooter({ text: 'Sistema de economia 💸', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};
