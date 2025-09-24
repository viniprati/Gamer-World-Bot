const { MessageEmbed } = require('discord.js');
const { ownerId } = require('../../config.json');
const logger = require('../../logger');

module.exports = {
    name: 'addpremium',
    description: 'Adiciona o status Premium a um usuário (apenas para o dono do bot).',

    options: [
        {
            name: 'usuario',
            type: 'USER',
            description: 'O usuário que receberá o status Premium.',
            required: true,
        },
    ],

    run: async (client, interaction) => {
        // --- Verificação de Permissão ---
        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                content: '❌ | Este comando é restrito e só pode ser usado pelo dono do bot.',
                ephemeral: true
            });
        }

        const user = interaction.options.getUser('usuario');
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({ content: '❌ | Usuário não encontrado no servidor.', ephemeral: true });
        }

        // --- Lógica para Adicionar o Cargo ---
        // !!! MUITO IMPORTANTE: Substitua 'ID_DO_CARGO_PREMIUM' pelo ID real do cargo que você vai criar no servidor.
        const premiumRoleId = 'ID_DO_CARGO_PREMIUM'; 
        const premiumRole = interaction.guild.roles.cache.get(premiumRoleId);

        if (!premiumRole) {
            logger.error(`[CONFIG ERROR] O cargo Premium com ID ${premiumRoleId} não foi encontrado.`);
            return interaction.reply({
                content: '❌ | Erro de configuração: O cargo Premium não foi encontrado. Verifique os logs.',
                ephemeral: true
            });
        }

        try {
            if (member.roles.cache.has(premiumRoleId)) {
                return interaction.reply({
                    content: `🟡 | ${user.username} já possui o status Premium.`,
                    ephemeral: true
                });
            }
            
            await member.roles.add(premiumRole);

            const embed = new MessageEmbed()
                .setColor('#FFD700') // Cor dourada
                .setTitle('✨ Status Premium Concedido!')
                .setDescription(`**${user.username}** agora é um membro Premium!`)
                .addField('Benefícios Ativados:', '• Recompensas em dobro\n• Tempo de espera reduzido em 10%')
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Status concedido por: ${interaction.user.username}` });

            interaction.reply({ embeds: [embed] });
            logger.log(`[PREMIUM] O status Premium foi concedido a ${user.tag} por ${interaction.user.tag}.`);

        } catch (error) {
            logger.error(`[PREMIUM ERROR] Falha ao adicionar o cargo Premium a ${user.tag}:`, error);
            interaction.reply({
                content: '❌ | Ocorreu um erro ao tentar adicionar o cargo. Verifique os logs.',
                ephemeral: true
            });
        }
    }
};