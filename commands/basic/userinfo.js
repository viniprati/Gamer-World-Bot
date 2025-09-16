const { EmbedBuilder } = require('discord.js');
const { getBadges } = require('./badgeManager.js'); 
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'userinfo',
    aliases: ['profile', 'perfil'],
    description: 'Mostra o perfil de jogador de um membro do servidor.',
    cooldown: 10,
    async execute(message, args, client) {
        // CORRIGIDO: Pega o membro do servidor (para cargos, data de entrada, etc.)
        const member = message.mentions.members.first() || message.member;
        
        // Busca o objeto de usuário (para dados globais como banner, data de criação da conta)
        // Usamos { force: true } para garantir que o banner seja sempre o mais recente
        const user = await client.users.fetch(member.id, { force: true });

        // --- Leitura de Dados de Economia e Ranking ---
        const economyPath = path.join(__dirname, '..', '..', 'economy.json');
        let economyData = {};
        if (fs.existsSync(economyPath)) {
            economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
        }
        const userData = economyData[user.id] || {};
        const balance = userData?.balance || userData || 0;

        const sortedUsers = Object.entries(economyData)
            .sort(([, a], [, b]) => (b?.balance || b || 0) - (a?.balance || a || 0))
            .map(([id]) => id);
        const topRanking = sortedUsers.indexOf(user.id) + 1;

        // --- Formatação dos Dados para o Embed ---
        const statusMap = {
            online: '🟢 Online', idle: '🟡 Ausente',
            dnd: '🔴 Não Perturbe', offline: '⚫ Offline / Invisível'
        };
        const userStatus = member.presence ? statusMap[member.presence.status] : statusMap.offline;

        const createdAtTimestamp = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:f>`;
        const joinedAtTimestamp = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;

        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());
        
        let roleDisplay = roles.length > 0 ? roles.join(', ') : 'Nenhum cargo notável';
        if (roleDisplay.length > 1024) {
            roleDisplay = `${roleDisplay.substring(0, 1020)}...`;
        }
        
        const badges = getBadges(member, userData, topRanking);

        // --- Criação do Embed de Perfil de Jogador ---
        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor === '#000000' ? '#5865F2' : member.displayHexColor)
            .setAuthor({ name: `Perfil de Jogador: ${user.username}`, iconURL: user.displayAvatarURL() })
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🎮 Informações do Jogador', value: `**Tag:** ${user.tag}\n**ID:** \`${user.id}\``, inline: true },
                { name: '💰 Inventário', value: `**GameCoins:** ${balance.toLocaleString('pt-BR')}\n**Rank:** #${topRanking > 0 ? topRanking : 'N/A'}`, inline: true },
                { name: '🌐 Status de Conexão', value: userStatus, inline: false },
                { name: '⏳ Linha do Tempo', value: `**Conta criada em:** ${createdAtTimestamp}\n**Entrou na guilda:** ${joinedAtTimestamp}`, inline: false },
                { name: `🛡️ Tags de Clã (${roles.length})`, value: roleDisplay, inline: false },
                { name: '🏆 Conquistas', value: badges, inline: false }
            )
            .setTimestamp()
            .setFooter({ text: `Gamer World Profile Card` });

        // Se o usuário tiver um banner de perfil, usa como imagem principal
        if (user.banner) {
            embed.setImage(user.bannerURL({ dynamic: true, size: 512 }));
        }

        // Envia a resposta final
        await message.channel.send({ embeds: [embed] });
    },
};