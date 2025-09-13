const { EmbedBuilder } = require('discord.js');
// Importa TODOS os IDs de canais de log do seu config
const { LOG_SERVER_ID, ECONOMY_LOG, VIP_LOG, TRANSACTION_LOG, DAILY_LOG } = require('./config.json');

// ===================================================================
// CONFIGURAÇÃO CENTRAL DE LOGS
// Para adicionar um novo tipo de log, basta adicionar uma nova entrada aqui.
// ===================================================================
const LOG_CONFIG = {
    daily: {
        channelId: DAILY_LOG,
        color: '#3498db', // Azul claro
        title: '🗓️ Log de Daily',
        buildDescription: data => 
            `**Usuário:** <@${data.userId}> (${data.userId})\n` +
            `**Recebeu:** ${data.amount.toLocaleString('pt-BR')} moedas\n` +
            `**Saldo Atual:** ${data.newBalance.toLocaleString('pt-BR')} moedas`,
        validate: data => data.userId && data.amount != null && data.newBalance != null,
    },
    economy: {
        channelId: ECONOMY_LOG,
        color: '#2ecc71', // Verde
        title: '💰 Log de Economia',
        buildDescription: data => 
            `**Usuário:** <@${data.userId}> (${data.userId})\n` +
            `**Ação:** ${data.action}\n` +
            `**Valor:** ${data.amount.toLocaleString('pt-BR')} moedas\n` +
            `**Saldo Atual:** ${data.newBalance.toLocaleString('pt-BR')} moedas`,
        validate: data => data.userId && data.action && data.amount != null && data.newBalance != null,
    },
    vip: {
        channelId: VIP_LOG,
        color: '#f1c40f', // Amarelo/Ouro
        title: '👑 Log de VIP',
        buildDescription: data => `O usuário <@${data.userId}> comprou o **${data.vipName}**.`,
        validate: data => data.userId && data.vipName,
    },
    transaction: {
        channelId: TRANSACTION_LOG,
        color: '#e91e63', // Rosa
        title: '🔄 Log de Transação',
        buildDescription: data => `O usuário <@${data.fromId}> enviou **${data.amount.toLocaleString('pt-BR')} moedas** para <@${data.toId}>.`,
        validate: data => data.fromId && data.toId && data.amount != null,
    }
    // Adicione novos tipos de log aqui no futuro!
};

// ===================================================================
// FUNÇÃO PRINCIPAL (Não precisa mais ser alterada)
// ===================================================================
async function sendLog(client, type, data) {
    const config = LOG_CONFIG[type];

    if (!config) {
        console.warn(`[Logger] Tipo de log desconhecido tentou ser enviado: "${type}"`);
        return;
    }
    
    if (!config.validate(data)) {
        console.error(`[Logger] Dados insuficientes ou inválidos para o log do tipo "${type}". Dados recebidos:`, data);
        return;
    }

    try {
        const guild = await client.guilds.fetch(LOG_SERVER_ID);
        if (!guild) {
            return console.error(`[Logger] Servidor de logs com ID ${LOG_SERVER_ID} não encontrado.`);
        }
        
        const channel = await guild.channels.fetch(config.channelId);
        if (!channel) {
            return console.error(`[Logger] Canal de log com ID ${config.channelId} para o tipo "${type}" não foi encontrado.`);
        }

        const embed = new EmbedBuilder()
            .setColor(config.color)
            .setTitle(config.title)
            .setDescription(config.buildDescription(data))
            .setTimestamp()
            .setFooter({ text: 'Gamer World | Sistema de Logs', iconURL: client.user.displayAvatarURL() });

        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error(`[Logger] Ocorreu um erro catastrófico ao tentar enviar um log do tipo "${type}":`, error);
    }
}

module.exports = { sendLog };