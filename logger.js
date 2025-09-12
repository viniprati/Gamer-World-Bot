// CÓDIGO CORRIGIDO PARA: logger.js

const { EmbedBuilder } = require('discord.js');
// CORREÇÃO: Usa './' para encontrar o config.json na mesma pasta (raiz).
const { LOG_SERVER_ID, ECONOMY_LOG, VIP_LOG, TRANSACTION_LOG } = require('./config.json');

async function sendLog(client, type, data) {
    try {
        const guild = await client.guilds.fetch(LOG_SERVER_ID);
        if (!guild) {
            console.error(`[Logger] Servidor de logs com ID ${LOG_SERVER_ID} não encontrado.`);
            return;
        }

        let channelId;
        const embed = new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: 'Sistema de Logs', iconURL: client.user.displayAvatarURL() });

        switch (type) {
            case 'economy':
                if (!data.userId || !data.action || data.amount == null || data.newBalance == null) {
                    console.error('[Logger] Dados insuficientes para o log de economia. É necessário: userId, action, amount, newBalance.');
                    return;
                }
                channelId = ECONOMY_LOG;
                embed
                    .setTitle('💰 Log de Economia')
                    .setDescription(
                        `**Usuário:** <@${data.userId}> (${data.userId})\n` +
                        `**Ação:** ${data.action}\n` +
                        `**Valor:** ${data.amount.toLocaleString('pt-BR')} moedas\n` +
                        `**Saldo Atual:** ${data.newBalance.toLocaleString('pt-BR')} moedas`
                    )
                    .setColor('Green');
                break;

            case 'vip':
                if (!data.userId || !data.vipName) {
                    console.error('[Logger] Dados insuficientes para o log de VIP. É necessário: userId, vipName.');
                    return;
                }
                channelId = VIP_LOG;
                embed
                    .setTitle('👑 Log de VIP')
                    .setDescription(`O usuário <@${data.userId}> comprou o VIP **${data.vipName}**.`)
                    .setColor('Gold');
                break;

            case 'transaction':
                if (!data.fromId || !data.toId || !data.amount) {
                    console.error('[Logger] Dados insuficientes para o log de transação. É necessário: fromId, toId, amount.');
                    return;
                }
                channelId = TRANSACTION_LOG;
                embed
                    .setTitle('🔄 Log de Transação')
                    .setDescription(`O usuário <@${data.fromId}> enviou **${data.amount.toLocaleString('pt-BR')} moedas** para <@${data.toId}>.`)
                    .setColor('Blue');
                break;
            
            default:
                console.warn(`[Logger] Tipo de log desconhecido: "${type}"`);
                return;
        }

        const channel = await guild.channels.fetch(channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        } else {
            console.error(`[Logger] Canal de log com ID ${channelId} não encontrado no servidor ${guild.name}.`);
        }

    } catch (error) {
        console.error('[Logger] Ocorreu um erro ao tentar enviar um log:', error);
    }
}

module.exports = { sendLog };