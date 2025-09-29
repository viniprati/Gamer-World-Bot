const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBadges } = require('../../utils/badgeManager.js'); 
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Mostra o perfil de jogador de um membro do servidor.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário que você quer ver o perfil (opcional).')
                .setRequired(false)),

    name: 'userinfo',
    aliases: ['profile', 'perfil'],
    description: 'Mostra o perfil de jogador de um membro do servidor.',
    cooldown: 10,

    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        
        const reply = (options) => {
            const finalOptions = typeof options === 'string' ? { content: options } : options;
            if (isSlash) {
                return interactionOrMessage.reply(options);
            }
            finalOptions.allowedMentions = { repliedUser: false };
            return interactionOrMessage.reply(finalOptions);
        };

        try {
            const targetUser = isSlash
                ? (interactionOrMessage.options.getUser('usuario') || interactionOrMessage.user)
                : (interactionOrMessage.mentions.users.first() || interactionOrMessage.author);

            const member = await guild.members.fetch({ user: targetUser.id, force: true });
            
            if (!member) {
                return reply({ content: 'Não consegui encontrar este membro no servidor.', ephemeral: true });
            }
            const user = member.user;

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

            const statusMap = {
                online: '🟢 Online', idle: '🟡 Ausente',
                dnd: '🔴 Não Perturbe', offline: '⚫ Offline / Invisível'
            };
            const userStatus = member.presence ? statusMap[member.presence.status] : statusMap.offline;

            const createdAtTimestamp = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:f>`;
            const joinedAtTimestamp = `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`;

            const roles = member.roles.cache
                .filter(role => role.id !== guild.id)
                .sort((a, b) => b.position - a.position)
                .map(role => `\`${role.name}\``); // Alterado para não marcar os cargos
            
            let roleDisplay = roles.length > 0 ? roles.join(', ') : 'Nenhum cargo notável';
            if (roleDisplay.length > 1024) {
                roleDisplay = `${roleDisplay.substring(0, 1020)}...`;
            }
            
            const badges = getBadges(member, userData, topRanking);

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

            // A busca pelo banner agora é feita no 'user' atualizado
            const fetchedUser = await client.users.fetch(user.id, { force: true });
            if (fetchedUser.banner) {
                embed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 512 }));
            }

            await reply({ embeds: [embed] });

        } catch (error) {
            console.error("Erro no comando userinfo:", error);
            reply({ content: 'Ocorreu um erro ao buscar as informações deste usuário.', ephemeral: true });
        }
    },
};