const { EmbedBuilder } = require('discord.js');
const { getBadges } = require('../../commands/basic/badge');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'userinfo',
    description: 'Mostra informações sobre um usuário mencionado.',
    async execute(message, args, client) {
        const member = message.mentions.members.first() || message.member;

        if (!member) return message.reply('Por favor, mencione um usuário ou forneça um ID de usuário.');

        // Puxando dados do economy.json para insígnias relacionadas a moedas, commands, etc.
        const filePath = path.join(__dirname, '../../economy.json');
        let dataFile = {};
        if (fs.existsSync(filePath)) dataFile = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const userData = dataFile[member.id] || {};

        // Puxando ranking (top 1, top 2, etc.) para insígnias de top ranking
        const sortedUsers = Object.entries(dataFile)
            .sort(([, a], [, b]) => b.balance - a.balance)
            .map(([id]) => id);
        const topRanking = sortedUsers.indexOf(member.id) + 1;

        // Ordena cargos pela posição e remove @everyone
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .join(', ') || 'Nenhum';

        // Pega as insígnias do usuário
        const badges = getBadges(member, userData, topRanking);

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`👤 Informações de Usuário: ${member.user.tag}`)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID do Usuário', value: member.user.id, inline: true },
                { name: '📝 Nome de Usuário', value: member.user.username, inline: true },
                { name: '🏷️ Apelido', value: member.nickname || 'Nenhum', inline: true },
                { name: '📅 Entrou no Discord', value: member.user.createdAt.toDateString(), inline: true },
                { name: '📅 Entrou no Servidor', value: member.joinedAt ? member.joinedAt.toDateString() : 'N/A', inline: true },
                { name: '🏅 Insígnias', value: badges, inline: false },
                { name: '🎭 Cargos', value: roles, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${message.author.tag}` });

        message.channel.send({ embeds: [embed] });
    },
};
