const { EmbedBuilder } = require("discord.js");

const LOG_SERVER_ID = "1251297674058137751";
const ECONOMY_LOG = "1415447984778252390";
const VIP_LOG = "1415448011038916719";
const TRANSACTION_LOG = "1415448038981369989";

function sendLog(client, type, data) {
    const guild = client.guilds.cache.get(LOG_SERVER_ID);
    if (!guild) return;

    let channelId;
    let embed;

    switch (type) {
        case "economy":
            channelId = ECONOMY_LOG;
            embed = new EmbedBuilder()
                .setTitle("💰 Economia - AddCoins")
                .setDescription(`Usuário <@${data.userId}> agora tem **${data.amount} coins**`)
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
                .setDescription(`Usuário <@${data.from}> enviou **${data.amount} coins** para <@${data.to}>`)
                .setColor("Blue")
                .setTimestamp()
                .setFooter({ text: "Sistema de Logs", iconURL: client.user.displayAvatarURL() });
            break;
    }

    const channel = guild.channels.cache.get(channelId);
    if (channel && embed) channel.send({ embeds: [embed] });
}

module.exports = { sendLog };
