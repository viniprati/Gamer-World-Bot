const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');

const ECONOMY_PATH = path.join(__dirname, '..', 'economy.json');
let changeCounter = 0;

module.exports = {
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente pessoas autorizadas).',
    async execute(message, args, client) {
        const allowedUsers = [
            '1077723832036630528', // Dago
            '983870132063453235', // Prati
            '820041555443449856', // Gb
            '1109255544495145021' // Prince
        ];

        if (!allowedUsers.includes(message.author.id)) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para adicionar moedas.');
        if (!amount || amount <= 0) return message.reply('Digite um valor válido.');

        let data = {};
        if (fs.existsSync(ECONOMY_PATH)) data = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));

        if (!data[target.id]) data[target.id] = 0;
        data[target.id] += amount;

        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(data, null, 2));

        // Log resumido no servidor
        sendLog(client, "economy", { 
            userId: target.id, 
            received: amount, 
            amount: data[target.id] 
        });

        // Backup automático
        changeCounter++;
        if (changeCounter >= 20) {
            const guild = client.guilds.cache.get("1251297674058137751");
            const channel = guild?.channels.cache.get("1415447984778252390");
            if (channel) {
                channel.send({
                    content: "📄 Backup do economy.json (20 alterações acumuladas)",
                    files: [ECONOMY_PATH],
                });
            }
            changeCounter = 0;
        }

        message.reply(
            `✅ Adicionadas **${amount} moedas** para ${target.user.tag}. Agora ele tem **${data[target.id]} moedas**.`
        );
    },
};
