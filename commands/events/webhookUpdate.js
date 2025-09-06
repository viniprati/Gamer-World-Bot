module.exports = {
    name: 'webhookUpdate',
    async execute(channel) {
        try {
            const guild = channel.guild;

            const logs = await guild.fetchAuditLogs({
                type: 50, // WEBHOOK_CREATE
                limit: 1
            });
            const entry = logs.entries.first();
            const executor = entry ? entry.executor : null;

            const webhooks = await channel.fetchWebhooks();
            const suspicious = [];

            webhooks.forEach(wh => {
                if (!wh.owner) return;
                if (wh.owner.id !== channel.client.user.id) {
                    suspicious.push(wh);
                }
            });

            if (suspicious.length > 0) {
                for (const wh of suspicious) {
                    await wh.delete('Webhook suspeito detectado e removido pelo sistema de segurança.');
                }

                const logChannel = guild.channels.cache.get('1367613666517712981');
                if (logChannel) {
                    logChannel.send(
                        `⚠️ **Webhook suspeito removido!**\n` +
                        `📍 Canal: <#${channel.id}>\n` +
                        `👤 Criado por: ${executor ? executor.tag : 'Desconhecido'}`
                    );
                }
            }
        } catch (err) {
            console.error('Erro ao monitorar webhook:', err);
        }
    }
};
