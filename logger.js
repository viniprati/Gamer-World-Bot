async function sendLog(client, type, data) {
    const guild = await client.guilds.fetch(LOG_SERVER_ID).catch(() => null);
    if (!guild) return;

    let channelId;
    let embed;

    switch (type) {
        case "economy":
            channelId = ECONOMY_LOG;
            embed = new EmbedBuilder()
                .setTitle("💰 Economia")
                .setDescription(`Usuário <@${data.userId}> recebeu **${data.received || data.amount} moedas**.\nAgora possui **${data.amount} moedas**.`)
                .setColor("Green")
                .setTimestamp()
                .setFooter({ text: "Sistema de Logs", iconURL: client.user.displayAvatarURL() });
            break;
        case "vip":
            channelId = VIP_LOG;
            embed = new EmbedBuilder()
                .setTitle("👑 Compra de VIP")
                .setDescription(`Usuário <@${data.userId}> comprou o VIP **${data.vipName}**`)
                .setColor("Gold")
                .setTimestamp()
                .setFooter({ text: "Sistema de Logs", iconURL: client.user.displayAvatarURL() });
            break;
        case "transaction":
            channelId = TRANSACTION_LOG;
            embed = new EmbedBuilder()
                .setTitle("🔄 Transação")
                .setDescription(`Usuário <@${data.from}> enviou **${data.amount} moedas** para <@${data.to}>`)
                .setColor("Blue")
                .setTimestamp()
                .setFooter({ text: "Sistema de Logs", iconURL: client.user.displayAvatarURL() });
            break;
    }

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (channel && embed) channel.send({ embeds: [embed] });
}
