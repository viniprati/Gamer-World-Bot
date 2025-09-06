const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'Silencia um usuário no servidor.',
    async execute(message, args, client) {
        // Verifica se o usuário tem permissão de moderar membros
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
            return message.reply('Você não tem permissão para mutar membros.');
        }

        const member = message.mentions.members.first();
        if (!member) return message.reply('Mencione o usuário que deseja mutar.');

        if (member.id === message.author.id) {
            return message.reply('Você não pode se mutar!');
        }

        if (member.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply('Você não pode mutar um usuário com cargo igual ou superior ao seu.');
        }

        // Procura ou cria cargo “Muted”
        let mutedRole = message.guild.roles.cache.find(r => r.name === 'Muted');
        if (!mutedRole) {
            try {
                mutedRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#555555',
                    permissions: []
                });

                // Bloqueia envio de mensagens e voz em todos os canais
                for (const [channelId, channel] of message.guild.channels.cache) {
                    await channel.permissionOverwrites.create(mutedRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    });
                }
            } catch (err) {
                console.error(err);
                return message.reply('Não foi possível criar o cargo Muted.');
            }
        }

        const reason = args.slice(1).join(' ') || 'Nenhuma razão fornecida.';
        await member.roles.add(mutedRole);

        message.channel.send(`**${member.user.tag}** foi mutado. Razão: ${reason}`);
    },
};
