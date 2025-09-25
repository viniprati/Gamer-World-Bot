const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um usuário do servidor.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário que você deseja expulsar.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('O motivo da expulsão (opcional).')
                .setRequired(false))
        // Garante que apenas membros com permissão de expulsar possam ver e usar o comando
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'kick',
    description: 'Expulsa um usuário do servidor.',

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        const member = isSlash ? interactionOrMessage.member : interactionOrMessage.member;
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        const channel = isSlash ? interactionOrMessage.channel : interactionOrMessage.channel;
        
        const targetMember = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const reason = isSlash ? interactionOrMessage.options.getString('motivo') || 'Nenhuma razão fornecida.' : args.slice(1).join(' ') || 'Nenhuma razão fornecida.';
        
        const reply = (options) => {
            const finalOptions = typeof options === 'string' ? { content: options } : options;
            if (isSlash) finalOptions.ephemeral = true;
            return isSlash ? interactionOrMessage.reply(finalOptions) : interactionOrMessage.reply(finalOptions);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // 1. Verificação de Permissão do Autor (essencial para prefixo)
        if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return reply('🚫 Você não tem permissão para usar este comando.');
        }

        // 2. Verificação de Permissão do Bot
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return reply('🚫 Eu não tenho permissão para expulsar membros neste servidor.');
        }
        
        // 3. Validação do Alvo
        if (!targetMember) {
            return reply('❗ Por favor, mencione um usuário válido para expulsar.');
        }

        if (targetMember.id === member.user.id) {
            return reply('❗ Você não pode se expulsar!');
        }
        
        // 4. Verificação de Hierarquia e Habilidade de Expulsar
        if (targetMember.roles.highest.position >= member.roles.highest.position) {
            return reply('❗ Você não pode expulsar alguém com cargo igual ou superior ao seu.');
        }

        if (!targetMember.kickable) {
            return reply('⚠️ Eu não posso expulsar este usuário. Verifique se meu cargo está acima do dele.');
        }

        // 5. Execução e Resposta
        try {
            await targetMember.kick(reason);
            // A resposta de sucesso é pública
            await channel.send(`✅ **${targetMember.user.tag}** foi expulso.\n📌 Razão: *${reason}*`);
            // Se for slash, damos uma resposta silenciosa para a interação não falhar
            if (isSlash) await interactionOrMessage.reply({ content: 'Ação concluída.', ephemeral: true });

        } catch (error) {
            console.error(error);
            reply('⚠️ Não foi possível expulsar este usuário.');
        }
    },
};