
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'balance',
    description: 'Mostra seu saldo de moedas e posição no ranking.',
    async execute(message, args, client) {
        const filePath = path.join(__dirname, '..', '..', 'economy.json');
        let data = {};
        if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        const userId = message.author.id;
        const userData = data[userId];

        // CORREÇÃO: Lê o saldo de forma inteligente
        const balance = (userData && userData.balance) || userData || 0;

        const ranking = Object.entries(data)
            // CORREÇÃO: Ordena o ranking lendo a propriedade 'balance' se ela existir
            .sort(([, a], [, b]) => ((b.balance || b) - (a.balance || a)))
            .map(([id]) => id);

        const position = ranking.indexOf(userId) + 1;

        const embed = new EmbedBuilder()
            .setColor('#00BFFF')
            .setTitle(`💰 Saldo de ${message.author.username}`)
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Moedas', value: `🎮 ${balance.toLocaleString('pt-BR')}`, inline: true },
                { name: 'Ranking', value: `🏆 ${position}º lugar`, inline: true }
            )
            .setFooter({ text: 'Sistema de economia 💸', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};