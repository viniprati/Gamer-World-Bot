const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
let changeCounter = 0;

module.exports = {
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente pessoas autorizadas).',
    cooldown: 5, 
    async execute(message, args, client) {
        const allowedUsers = ['1077723832036630528', '983870132063453235', '820041555443449856', '1109255544495145021'];
        if (!allowedUsers.includes(message.author.id)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para adicionar moedas.');
        if (isNaN(amount) || amount <= 0) return message.reply('Digite um valor válido.');

        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const targetId = target.id;

        // REVERTIDO: Lê o saldo como um número simples
        const currentBalance = economyData[targetId] || 0;
        const newBalance = currentBalance + amount;

        // REVERTIDO: Salva o saldo como um número simples
        economyData[targetId] = newBalance;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        // A chamada de log continua funcionando, pois 'newBalance' é um número
        await sendLog(client, "economy", { 
            userId: targetId, 
            action: `Moedas adicionadas por Staff (${message.author.tag})`,
            amount: amount, 
            newBalance: newBalance
        });

        // Lógica de backup (mantida)
        changeCounter++;
        if (changeCounter >= 20) {
            const guild = client.guilds.cache.get("1251297674058137751");
            const channel = guild?.channels.cache.get("1415447984778252390");
            if (channel) {
                await channel.send({ content: "📄 Backup do economy.json", files: [ECONOMY_PATH] });
            }
            changeCounter = 0;
        }

        const fmt = (n) => n.toLocaleString('pt-BR');
        message.reply(`✅ Adicionadas **${fmt(amount)} moedas** para ${target.user.tag}. Agora ele tem **${fmt(newBalance)} moedas**.`);
    },
};