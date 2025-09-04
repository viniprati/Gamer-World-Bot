const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Bane um usuário do servidor.',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('Você não tem permissão para usar este comando.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Por favor, mencione o usuário que deseja banir.');
        }

        if (member.id === message.author.id) {
            return message.reply('Você não pode se banir!');
        }

        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('Você não pode banir um usuário com cargo igual ou superior ao seu.');
        }

        const reason = args.slice(1).join(' ') || 'Nenhuma razão fornecida.';

        try {
            await member.ban({ reason });
            message.channel.send(`**${member.user.tag}** foi banido. Razão: ${reason}`);
        } catch (error) {
            console.error(error);
            message.reply('Não foi possível banir este usuário. Verifique minhas permissões.');
        }
    },
};