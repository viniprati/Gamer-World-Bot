const fs = require('fs');
// Importa os IDs necessários do seu arquivo de configuração principal
const { LOG_SERVER_ID, BACKUP_CHANNEL_ID } = require('../config.json');

// Define quantas alterações são necessárias para acionar um backup.
// 50 é um bom número para evitar spam em um servidor ativo.
const BACKUP_THRESHOLD = 50; 

// Esta variável age como um contador simples.
// Ela fica na memória e será resetada se o bot reiniciar.
let changeCounter = 0;

/**
 * Verifica se o backup deve ser acionado e o envia se necessário.
 * Esta função será chamada toda vez que o economy.json for salvo.
 * @param {import('discord.js').Client} client O cliente do Discord.
 * @param {string} filePath O caminho para o arquivo que deve ser enviado no backup.
 */
async function checkAndBackup(client, filePath) {
    // Incrementa o contador a cada chamada
    changeCounter++;

    // Se o contador ainda não atingiu o limite, a função para aqui.
    if (changeCounter < BACKUP_THRESHOLD) {
        return;
    }

    console.log(`[Backup Manager] Limite de ${BACKUP_THRESHOLD} alterações atingido. Enviando backup do economy.json...`);

    try {
        // Busca o servidor de logs
        const guild = await client.guilds.fetch(LOG_SERVER_ID);
        if (!guild) {
            console.error('[Backup Manager] Servidor de logs não encontrado. Verifique o LOG_SERVER_ID no config.json.');
            return;
        }

        // Busca o canal de backup dentro do servidor de logs
        const channel = await guild.channels.fetch(BACKUP_CHANNEL_ID);
        if (!channel) {
            console.error('[Backup Manager] Canal de backup não encontrado. Verifique o BACKUP_CHANNEL_ID no config.json.');
            return;
        }

        // Envia a mensagem com o arquivo de backup
        await channel.send({
            content: `📄 **Backup Automático**\nO arquivo \`economy.json\` foi salvo após acumular **${changeCounter}** alterações.`,
            files: [filePath],
        });

        console.log(`[Backup Manager] Backup enviado com sucesso para o canal #${channel.name}.`);

        // Reseta o contador para começar a contagem novamente.
        changeCounter = 0;

    } catch (error) {
        console.error('❌ Falha crítica ao enviar o backup do economy.json:', error);
        // Importante: Não reseta o contador se falhar, para que ele tente novamente na próxima alteração.
    }
}

// Exporta a função para que o index.js possa usá-la.
module.exports = { checkAndBackup };