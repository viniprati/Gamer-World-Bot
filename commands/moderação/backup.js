const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { LOG_SERVER_ID, BACKUP_CHANNEL_ID } = require('../../config.json');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Força um backup manual do arquivo de economia (somente staff).'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'backup',
    description: 'Força um backup manual do arquivo de economia (somente staff autorizada).',
    cooldown: 60,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---
        
        const allowedUsers = [
            '1077723832036630528', '983870132063453235',
            '820041555443449856', '1109255544495145021'
        ];

        if (!allowedUsers.includes(author.id)) {
            const replyOptions = { content: '❌ Você não tem permissão para usar este comando.' };
            if (isSlash) replyOptions.ephemeral = true;
            return isSlash ? interactionOrMessage.reply(replyOptions) : interactionOrMessage.reply(replyOptions);
        }

        if (!fs.existsSync(ECONOMY_PATH)) {
            const replyOptions = { content: '❌ Não foi possível encontrar o arquivo `economy.json` para fazer o backup.' };
            if (isSlash) replyOptions.ephemeral = true;
            return isSlash ? interactionOrMessage.reply(replyOptions) : interactionOrMessage.reply(replyOptions);
        }

        try {
            // Unifica a resposta inicial, adiando a do slash command para dar tempo ao bot
            if (isSlash) {
                await interactionOrMessage.deferReply({ ephemeral: true });
            }
            const initialReply = isSlash ? null : await interactionOrMessage.reply('⏳ Forçando um backup manual... Aguarde...');

            const guild = await client.guilds.fetch(LOG_SERVER_ID);
            if (!guild) {
                const errorMsg = '❌ Não foi possível encontrar o servidor de logs.';
                return isSlash ? interactionOrMessage.editReply(errorMsg) : initialReply.edit(errorMsg);
            }

            const channel = await guild.channels.fetch(BACKUP_CHANNEL_ID);
            if (!channel) {
                const errorMsg = '❌ Não foi possível encontrar o canal de backups no servidor de logs.';
                return isSlash ? interactionOrMessage.editReply(errorMsg) : initialReply.edit(errorMsg);
            }

            await channel.send({
                content: `📄 **Backup Manual Forçado**\nSolicitado por: ${author.tag} (\`${author.id}\`)`,
                files: [ECONOMY_PATH],
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Backup Realizado com Sucesso!')
                .setDescription(`O arquivo \`economy.json\` foi enviado com sucesso para o canal <#${BACKUP_CHANNEL_ID}>.`)
                .setTimestamp()
                .setFooter({ text: `Ação realizada por ${author.username}` });

            // Unifica a resposta final de sucesso
            if (isSlash) {
                await interactionOrMessage.editReply({ embeds: [successEmbed] });
            } else {
                await initialReply.edit({ content: '', embeds: [successEmbed] });
            }

        } catch (error) {
            console.error('❌ Falha ao executar o comando de backup manual:', error);
            const errorMsg = '❌ Ocorreu um erro crítico ao tentar enviar o backup. Verifique os logs do console.';
            if (isSlash) {
                // Se a resposta já foi deferida, usa editReply, senão, reply
                if (interactionOrMessage.deferred || interactionOrMessage.replied) {
                    await interactionOrMessage.editReply({ content: errorMsg, ephemeral: true });
                } else {
                    await interactionOrMessage.reply({ content: errorMsg, ephemeral: true });
                }
            } else {
                await interactionOrMessage.reply(errorMsg);

            }
        }
    },
};
