const { startGiveaway, endGiveaway } = require("./sorteios.js");

module.exports = {
  name: "sorteio",
  description: "Gerencia o sorteio manualmente",
  async execute(message, args) {
    const acao = args[0];

    if (!acao) {
      return message.reply("❌ Use: `!sorteio start` ou `!sorteio end`");
    }

    if (acao === "start") {
      await startGiveaway(message.client);
      return message.reply("✅ Sorteio iniciado manualmente!");
    }

    if (acao === "end") {
      await endGiveaway(message.client);
      return message.reply("✅ Sorteio finalizado manualmente!");
    }

    return message.reply("❌ Ação inválida. Use: `!sorteio start` ou `!sorteio end`");
  },
};
