const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");

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

// === Função para calcular o tempo até determinado horário ===
function getMillisecondsTo(hour, minute = 0) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1); // próximo dia
  return target - now;
}

// === Início do sorteio ===
async function startGiveaway(client) {
  const channel = await client.channels.fetch("1369838730528952350");
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("🎉 Sorteio Diário - Gamer World 🎉")
    .setDescription(`O sorteio começou!\n📌 Envie **100 mensagens válidas** até as **21:00** para participar!\nBoa sorte <@&1388270914516287678>!`)
    .setColor("Green")
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  // Resetar contagem
  messages = {};
  fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));

  console.log("Sorteio iniciado!");
}

// === Finalização do sorteio ===
async function endGiveaway(client) {
  const channel = await client.channels.fetch("1369838730528952350");
  if (!channel) return;

  const eligible = Object.entries(messages)
    .filter(([_, count]) => count >= 100)
    .map(([id]) => id);

  if (eligible.length === 0) {
    return channel.send("😢 Nenhum usuário atingiu 100 mensagens hoje, então não houve vencedores.");
  }

  const shuffled = eligible.sort(() => 0.5 - Math.random());
  const winners = shuffled.slice(0, 2);
  const winnerUsers = await Promise.all(winners.map(id => client.users.fetch(id)));

  const top5 = Object.entries(messages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count], i) => `**${i + 1}.** <@${id}> - ${count} mensagens`);

  const embed = new EmbedBuilder()
    .setTitle("🏆 Resultado do Sorteio Diário - Gamer World 🏆")
    .setDescription(`Parabéns aos vencedores do sorteio diário de **500k Sonhos**! 🎉\n💰 Cada um recebeu 250k Sonhos.`)
    .addFields(
      { name: "🏅 Vencedores", value: winnerUsers.map(u => `<@${u.id}>`).join("\n") },
      { name: "📊 Top 5 Mensagens do Dia", value: top5.join("\n") }
    )
    .setColor("Gold")
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  // Resetar contagem
  messages = {};
  fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));

  console.log("Sorteio finalizado!");
}

// === Agendamento automático usando setTimeout ===
function scheduleGiveaway(client) {
  const startIn = getMillisecondsTo(7, 0); // 07:00
  const endIn = getMillisecondsTo(21, 0);  // 21:00

  setTimeout(async function start() {
    await startGiveaway(client);
    setTimeout(async function end() {
      await endGiveaway(client);
      scheduleGiveaway(client); // agendar para o próximo dia
    }, 14 * 60 * 60 * 1000); // 14h entre 7h e 21h
  }, startIn);
}

module.exports = { handleMessage, scheduleGiveaway };
