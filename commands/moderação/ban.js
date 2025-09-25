const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um usuário do servidor.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário que você deseja banir.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('O motivo do banimento (opcional).')
                .setRequired(false))
        // Garante que apenas membros com permissão de banir possam ver e usar o comando
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'ban',
    description: 'Bane um usuário do servidor.',

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        const member = isSlash ? interactionOrMessage.member : interactionOrMessage.member;
        const channel = isSlash ? interactionOrMessage.channel : interactionOrMessage.channel;
        
        const targetMember = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const reason = isSlash ? interactionOrMessage.options.getString('motivo') || 'Nenhuma razão fornecida.' : args.slice(1).join(' ') || 'Nenhuma razão fornecida.';
        
        const reply = (options) => {
            const finalOptions = typeof options === 'string' ? { content: options } : options;
            if (isSlash) finalOptions.ephemeral = true; // Erros em slash são sempre privados
            return isSlash ? interactionOrMessage.reply(finalOptions) : interactionOrMessage.reply(finalOptions);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // 1. Verificação de Permissão (redundante para slash, mas essencial para prefix)
        if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return reply('Você não tem permissão para usar este comando.');
        }

        // 2. Validação do Alvo
        if (!targetMember) {
            return reply('Por favor, mencione um usuário válido para banir.');
        }

        if (targetMember.id === member.user.id) {
            return reply('Você não pode se banir!');
        }
        
        // 3. Verificação de Hierarquia e Habilidade de Banir
        if (targetMember.roles.highest.position >= member.roles.highest.position) {
            return reply('Você não pode banir um usuário com cargo igual ou superior ao seu.');
        }

        if (!targetMember.bannable) {
            return reply('Eu não posso banir este usuário. Verifique se meu cargo está acima do dele e se tenho a permissão de "Banir Membros".');
        }

        // 4. Execução e Resposta
        try {
            await targetMember.ban({ reason: reason });
            // A resposta de sucesso é pública para ambos os sistemas
            await channel.send(`✅ **${targetMember.user.tag}** foi banido com sucesso. Motivo: *${reason}*`);
            // Se for slash, precisamos dar uma resposta para a interação não falhar
            if (isSlash) await interactionOrMessage.reply({ content: 'Ação concluída.', ephemeral: true });

        } catch (error) {
            console.error(error);
            reply('Ocorreu um erro ao tentar banir este usuário.');
        }
    },
};