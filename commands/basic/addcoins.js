// CÓDIGO CORRIGIDO PARA: commands/basic/addcoins.js

const fs = require('fs');
const path = require('path');
// CORREÇÃO: O caminho sobe dois níveis para encontrar o logger.js na raiz.
const { sendLog } = require('../../logger.js'); 

// CORREÇÃO: O caminho também sobe dois níveis para encontrar o economy.json na raiz.
const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
let changeCounter = 0; // Este contador será resetado toda vez que o bot reiniciar. Considere salvar em um arquivo se precisar de persistência.

module.exports = {
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente pessoas autorizadas).',
    async execute(message, args, client) {
        const allowedUsers = ['1077723832036630528', '983870132063453235', '820041555443449856', '1109255544495145021'];
        if (!allowedUsers.includes(message.author.id)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para adicionar moedas.');
        if (isNaN(amount) || amount <= 0) return message.reply('Digite um valor válido.');

        let data = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            data = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        data[target.id] = (data[target.id] || 0) + amount;
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(data, null, 2));

        // Chamada de log
        await sendLog(client, "economy", { 
            userId: target.id, 
            action: `Adicionado por Staff (${message.author.tag})`,
            amount: amount, 
            newBalance: data[target.id] 
        });

        // Lógica de backup
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
        message.reply(`✅ Adicionadas **${fmt(amount)} moedas** para ${target.user.tag}. Agora ele tem **${fmt(data[target.id])} moedas**.`);
    },
};