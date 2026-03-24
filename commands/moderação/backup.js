const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('../../utils/config');
const { isAllowedStaff } = require('../../utils/permissions');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
const LOG_SERVER_ID = getConfig('LOG_SERVER_ID');
const BACKUP_CHANNEL_ID = getConfig('BACKUP_CHANNEL_ID');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Forca um backup manual do arquivo de economia (staff).')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    name: 'backup',
    description: 'Forca um backup manual do arquivo de economia (staff).',
    cooldown: 60,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        if (!isAllowedStaff(author.id)) {
            return reply({ content: 'Voce nao tem permissao para usar este comando.', ephemeral: isSlash });
        }
        if (!fs.existsSync(ECONOMY_PATH)) {
            return reply({ content: 'Arquivo economy.json nao encontrado para backup.', ephemeral: isSlash });
        }
        if (!LOG_SERVER_ID || !BACKUP_CHANNEL_ID) {
            return reply({ content: 'LOG_SERVER_ID/BACKUP_CHANNEL_ID nao configurados.', ephemeral: isSlash });
        }

        try {
            if (isSlash) {
                await interactionOrMessage.deferReply({ ephemeral: true });
            }

            const guild = await client.guilds.fetch(LOG_SERVER_ID);
            const channel = guild ? await guild.channels.fetch(BACKUP_CHANNEL_ID) : null;
            if (!channel) {
                const msg = 'Canal de backup nao encontrado.';
                return isSlash ? interactionOrMessage.editReply(msg) : interactionOrMessage.reply(msg);
            }

            await channel.send({
                content: `Backup manual solicitado por ${author.tag} (${author.id})`,
                files: [ECONOMY_PATH],
            });

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('Backup realizado')
                .setDescription(`Arquivo economy.json enviado para <#${BACKUP_CHANNEL_ID}>.`);

            if (isSlash) return interactionOrMessage.editReply({ embeds: [embed] });
            return interactionOrMessage.reply({ embeds: [embed] });
        } catch (error) {
            console.error('[backup] erro:', error);
            const msg = 'Erro ao executar backup.';
            if (isSlash) {
                if (interactionOrMessage.deferred || interactionOrMessage.replied) {
                    return interactionOrMessage.editReply({ content: msg });
                }
                return interactionOrMessage.reply({ content: msg, ephemeral: true });
            }
            return interactionOrMessage.reply(msg);
        }
    },
};
