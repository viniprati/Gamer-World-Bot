const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const cron = require("node-cron");

const msgPath = path.join(__dirname, "messages.json");
let messages = fs.existsSync(msgPath) ? JSON.parse(fs.readFileSync(msgPath)) : {};
const cooldown = new Map();

// === Contador de mensagens com antiflood ===
function handleMessage(message) {
  if (message.author.bot) return;

  const userId = message.author.id;
  const now = Date.now();

  if (cooldown.has(userId) && now - cooldown.get(userId) < 10_000) return;
  cooldown.set(userId, now);

  if (!messages[userId]) messages[userId] = 0;
  messages[userId]++;

  fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));
}

// === Início do sorteio ===
async function startGiveaway(client) {
  const channel = await client.channels.fetch("1369838730528952350");
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🎉 Sorteio Diário - Gamer World 🎉")
    .setDescription(`O sorteio começou! Enviem **100 mensagens válidas** até as **21:00** para participar!\n\nBoa sorte <@&1388270914516287678>!`)
    .setColor("Green")
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  // Resetar contagem no início do dia
  messages = {};
  fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));
}

// === Finalização e escolha do vencedor ===
async function endGiveaway(client) {
  const channel = await client.channels.fetch("1369838730528952350");
  if (!channel) return;

  const eligible = Object.entries(messages)
    .filter(([_, count]) => count >= 100)
    .map(([id]) => id);

  if (eligible.length === 0) {
    return channel.send("😢 Nenhum usuário atingiu 100 mensagens hoje, então não houve vencedor.");
  }

  const winnerId = eligible[Math.floor(Math.random() * eligible.length)];
  const winner = await client.users.fetch(winnerId);

  const embed = new EmbedBuilder()
    .setTitle("🏆 Resultado do Sorteio Diário - Gamer World 🏆")
    .setDescription(`Parabéns <@${winner.id}>! Você venceu o sorteio de hoje! 🎉`)
    .setColor("Gold")
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

// === Agendamento com node-cron ===
function scheduleGiveaway(client) {
  // 07:00 início
  cron.schedule("0 7 * * *", () => startGiveaway(client), { timezone: "America/Sao_Paulo" });

  // 21:00 fim
  cron.schedule("0 21 * * *", () => endGiveaway(client), { timezone: "America/Sao_Paulo" });
}

module.exports = { handleMessage, scheduleGiveaway };
