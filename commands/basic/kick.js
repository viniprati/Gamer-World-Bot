const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'Expulsa um usuário do servidor.',
    async execute(message, args, client) {
        // Verifica se o autor tem permissão de expulsar membros
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('🚫 Você não tem permissão para usar este comando.');
        }

        // Verifica se o bot tem a permissão também
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('🚫 Eu não tenho permissão para expulsar membros.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('❗ Por favor, mencione o usuário que deseja expulsar. Ex: `!kick @usuário motivo`');
        }

        if (member.id === message.author.id) {
            return message.reply('❗ Você não pode se expulsar!');
        }

        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('❗ Você não pode expulsar alguém com cargo igual ou superior ao seu.');
        }

        const reason = args.slice(1).join(' ') || 'Nenhuma razão fornecida.';

        try {
            await member.kick(reason);
            message.channel.send(`✅ **${member.user.tag}** foi expulso.\n📌 Razão: ${reason}`);
        } catch (error) {
            console.error(error);
            message.reply('⚠️ Não foi possível expulsar este usuário. Verifique minhas permissões.');
        }
    },
};
