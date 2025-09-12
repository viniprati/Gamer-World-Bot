const { EmbedBuilder } = require('discord.js');
// A função getBadges deve estar no mesmo diretório ou o caminho ajustado
const { getBadges } = require('./badge'); 
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'userinfo',
    description: 'Mostra informações detalhadas sobre um usuário.',
    async execute(message, args, client) {
        // Pega o membro mencionado ou o autor da mensagem
        const member = message.mentions.members.first() || message.member;

        // --- Leitura de Dados para Insígnias ---
        const economyPath = path.join(__dirname, '..', '..', 'economy.json');
        let economyData = {};
        if (fs.existsSync(economyPath)) {
            economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
        }
        const userData = economyData[member.id] || { balance: 0 };

        // Calcula o ranking do usuário com base no saldo
        const sortedUsers = Object.entries(economyData)
            .sort(([, a], [, b]) => (b.balance || 0) - (a.balance || 0))
            .map(([id]) => id);
        const topRanking = sortedUsers.indexOf(member.id) + 1;

        // --- Formatação dos Dados para o Embed ---

        // Status do usuário com emojis
        const statusMap = {
            online: '🟢 Online',
            idle: '🟡 Ausente',
            dnd: '🔴 Não Perturbe',
            offline: '⚫ Offline'
        };
        const userStatus = member.presence ? statusMap[member.presence.status] : '⚫ Offline';

        // Formata as datas para o padrão dinâmico do Discord
        const createdAtTimestamp = `<t:${Math.floor(member.user.createdAt.getTime() / 1000)}:F>`;
        const joinedAtTimestamp = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;

        // Lista de cargos, formatada e com limite de caracteres
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());
        
        let roleDisplay = roles.join(' ') || 'Nenhum cargo';
        if (roleDisplay.length > 1024) {
            roleDisplay = `${roleDisplay.substring(0, 1020)}...`;
        }
        
        // Pega as insígnias do usuário
        const badges = getBadges(member, userData, topRanking) || 'Nenhuma insígnia';

        // --- Criação do Embed ---

        const embed = new EmbedBuilder()
            // Usa a cor do cargo mais alto do usuário. Se for preto, usa um cinza padrão.
            .setColor(member.displayHexColor === '#000000' ? '#95a5a6' : member.displayHexColor)
            .setAuthor({ name: `Perfil de ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { 
                    name: '👤 Informações Principais', 
                    value: `**› Nick:** ${member.displayName}\n**› ID:** ${member.id}\n**› Status:** ${userStatus}`,
                    inline: false 
                },
                { 
                    name: '📅 Datas', 
                    value: `**› Criou a conta:** ${createdAtTimestamp}\n**› Entrou aqui:** ${joinedAtTimestamp}`,
                    inline: false 
                },
                { 
                    name: `🎭 Cargos [${roles.length}]`, 
                    value: roleDisplay,
                    inline: false 
                },
                { 
                    name: '🏅 Insígnias', 
                    value: badges,
                    inline: false 
                }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por: ${message.author.username}`, iconURL: message.author.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });
    },
};