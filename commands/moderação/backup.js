const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
// Importa os IDs do seu arquivo de configuração
const { LOG_SERVER_ID, BACKUP_CHANNEL_ID } = require('../../config.json');

// Define o caminho para o arquivo que será "backupeado"
const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    name: 'backup',
    description: 'Força um backup manual do arquivo de economia (somente staff autorizada).',
    cooldown: 60, // Cooldown de 1 minuto para evitar spam
    async execute(message, args, client) {
        // ===================================================================
        // COLOQUE AQUI OS IDs DOS USUÁRIOS AUTORIZADOS
        // ===================================================================
        const allowedUsers = [
            '1077723832036630528', // Dago
            '983870132063453235',  // Prati
            '820041555443449856',  // Gb
            '1109255544495145021'  // Prince
            // Adicione seu ID aqui também se não estiver na lista!
        ];

        if (!allowedUsers.includes(message.author.id)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        // Verifica se o arquivo de economia existe
        if (!fs.existsSync(ECONOMY_PATH)) {
            return message.reply('❌ Não foi possível encontrar o arquivo `economy.json` para fazer o backup.');
        }

        try {
            // Informa ao usuário que o processo começou
            const initialReply = await message.reply('⏳ Forçando um backup manual do `economy.json`. Aguarde...');

            // Busca o servidor e o canal de logs
            const guild = await client.guilds.fetch(LOG_SERVER_ID);
            if (!guild) {
                return initialReply.edit('❌ Não foi possível encontrar o servidor de logs.');
            }

            const channel = await guild.channels.fetch(BACKUP_CHANNEL_ID);
            if (!channel) {
                return initialReply.edit('❌ Não foi possível encontrar o canal de backups no servidor de logs.');
            }

            // Envia o arquivo para o canal de backup
            await channel.send({
                content: `📄 **Backup Manual Forçado**\nSolicitado por: ${message.author.tag} (\`${message.author.id}\`)`,
                files: [ECONOMY_PATH],
            });

            // Cria um embed de confirmação para o usuário
            const successEmbed = new EmbedBuilder()
                .setColor('#2ECC71') // Verde
                .setTitle('✅ Backup Realizado com Sucesso!')
                .setDescription(`O arquivo \`economy.json\` foi enviado com sucesso para o canal de backups <#${BACKUP_CHANNEL_ID}>.`)
                .setTimestamp()
                .setFooter({ text: `Ação realizada por ${message.author.username}` });

            // Edita a mensagem inicial com a confirmação
            await initialReply.edit({ content: '', embeds: [successEmbed] });

        } catch (error) {
            console.error('❌ Falha ao executar o comando de backup manual:', error);
            message.reply('❌ Ocorreu um erro crítico ao tentar enviar o backup. Verifique os logs do console.');
        }
    },
};