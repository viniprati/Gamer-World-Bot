const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Apaga um número específico de mensagens do chat.')
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('O número de mensagens a serem apagadas (entre 1 e 100).')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        // Garante que apenas membros com permissão de gerenciar mensagens possam usar o comando
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'clear',
    description: 'Apaga um número específico de mensagens do chat.',

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        const member = isSlash ? interactionOrMessage.member : interactionOrMessage.member;
        const channel = isSlash ? interactionOrMessage.channel : interactionOrMessage.channel;

        const amount = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[0]);

        const reply = (options) => {
            const finalOptions = typeof options === 'string' ? { content: options } : options;
            if (isSlash) finalOptions.ephemeral = true;
            return isSlash ? interactionOrMessage.reply(finalOptions) : interactionOrMessage.reply(finalOptions);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // 1. Verificação de Permissão (redundante para slash, mas essencial para prefix)
        if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return reply('Você não tem permissão para usar este comando.');
        }

        // 2. Validação da Quantidade (redundante para slash, mas essencial para prefix)
        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return reply('Por favor, forneça um número entre 1 e 100 para deletar.');
        }

        // 3. Execução e Resposta
        try {
            // Se for slash, precisamos de uma resposta inicial para a interação não falhar
            if (isSlash) {
                await interactionOrMessage.deferReply({ ephemeral: true });
            }

            const deletedMessages = await channel.bulkDelete(amount, true);
            
            const successMessage = `✅ Foram apagadas **${deletedMessages.size}** mensagens com sucesso.`;

            // Envia a resposta de sucesso e a apaga após 5 segundos
            if (isSlash) {
                await interactionOrMessage.editReply({ content: successMessage });
                // Não é necessário apagar a resposta efêmera, ela some sozinha.
            } else {
                channel.send(successMessage).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 5000);
                });
            }

        } catch (error) {
            console.error(error);
            const errorMessage = 'Não foi possível apagar as mensagens. Verifique minhas permissões e se as mensagens não são muito antigas (mais de 14 dias).';
            
            if (isSlash) {
                if (interactionOrMessage.deferred || interactionOrMessage.replied) {
                    await interactionOrMessage.editReply({ content: errorMessage });
                } else {
                    await reply({ content: errorMessage });
                }
            } else {
                await interactionOrMessage.reply(errorMessage);
            }
        }
    },
};