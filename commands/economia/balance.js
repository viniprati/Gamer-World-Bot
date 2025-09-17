const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    name: 'balance',
    aliases: ['bal', 'atm', 'carteira', 'ba'],
    description: 'Mostra o saldo de moedas de um usuário e sua posição no ranking.',
    cooldown: 5,
    async execute(message, args, client) {
        // MELHORIA 1: Permite mencionar um usuário ou, se não, usa o autor da mensagem.
        const target = message.mentions.members.first() || message.member;

        let data = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            data = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const userData = data[target.id];

        // Lógica de leitura inteligente (já estava correta)
        const balance = userData?.balance || userData || 0;

        // Lógica de ordenação (já estava correta)
        const ranking = Object.entries(data)
            .sort(([, a], [, b]) => (b?.balance || b || 0) - (a?.balance || a || 0))
            .map(([id]) => id);

        const position = ranking.indexOf(target.id) + 1;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Verde, cor de dinheiro
            .setAuthor({ name: `Carteira de ${target.user.username}`, iconURL: target.user.displayAvatarURL() })
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Moedas', value: `🎮 ${balance.toLocaleString('pt-BR')}`, inline: true },
                // MELHORIA 2: Mostra "Não ranqueado" se a posição for 0
                { name: 'Ranking', value: `🏆 ${position > 0 ? `${position}º lugar` : 'Não ranqueado'}`, inline: true }
            )
            .setFooter({ text: 'Gamer World Economia', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    },
};