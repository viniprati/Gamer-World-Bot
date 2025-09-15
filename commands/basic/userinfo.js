const { EmbedBuilder } = require('discord.js');
// CORRIGIDO: A importação agora aponta para o nosso arquivo de lógica, 'badgeManager.js'
const { getBadges } = require('./badgeManager.js'); 
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'userinfo',
    description: 'Mostra informações detalhadas sobre um usuário.',
    cooldown: 10, // Adicionado um cooldown
    async execute(message, args, client) {
        // Pega o membro mencionado ou o autor da mensagem
        const member = message.mentions.members.first() || message.member;

        // --- Leitura de Dados para Insígnias ---
        const economyPath = path.join(__dirname, '..', '..', 'economy.json');
        let economyData = {};
        if (fs.existsSync(economyPath)) {
            economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
        }
        const userData = economyData[member.id] || {}; // Usa userData para passar para as badges

        // CORRIGIDO: Calcula o ranking lendo o saldo de forma inteligente (número ou objeto)
        const sortedUsers = Object.entries(economyData)
            .sort(([, a], [, b]) => {
                const balanceA = a?.balance || a || 0;
                const balanceB = b?.balance || b || 0;
                return balanceB - balanceA;
            })
            .map(([id]) => id);
        const topRanking = sortedUsers.indexOf(member.id) + 1;

        // --- Formatação dos Dados para o Embed ---

        const statusMap = {
            online: '🟢 Online',
            idle: '🟡 Ausente',
            dnd: '🔴 Não Perturbe',
            offline: '⚫ Offline'
        };
        const userStatus = member.presence ? statusMap[member.presence.status] : '⚫ Offline';

        const createdAtTimestamp = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:F>`;
        const joinedAtTimestamp = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;

        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());
        
        let roleDisplay = roles.join(' ') || 'Nenhum cargo';
        if (roleDisplay.length > 1024) {
            roleDisplay = `${roleDisplay.substring(0, 1020)}...`;
        }
        
        // Pega as insígnias do usuário (agora com quebra de linha)
        const badges = getBadges(member, userData, topRanking);

        // --- Criação do Embed ---

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor === '#000000' ? '#95a5a6' : member.displayHexColor)
            .setAuthor({ name: `Perfil de ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '👤 Informações Principais', value: `**› Nick:** ${member.displayName}\n**› ID:** ${member.id}\n**› Status:** ${userStatus}`, inline: false },
                { name: '📅 Datas', value: `**› Criou a conta:** ${createdAtTimestamp}\n**› Entrou aqui:** ${joinedAtTimestamp}`, inline: false },
                { name: `🎭 Cargos [${roles.length}]`, value: roleDisplay, inline: false },
                { name: '🏅 Insígnias', value: badges, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por: ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    },
};