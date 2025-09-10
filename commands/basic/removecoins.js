const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');

const ECONOMY_PATH = path.join(__dirname, '..', 'economy.json');
let changeCounter = 0; // contador global de alterações

module.exports = {
    name: 'removecoins',
    description: 'Remove moedas de um usuário (somente admins).',
    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ Você não tem permissão para usar este comando.');
        }

        const target = message.mentions.members.first();
        const amount = parseInt(args[1]);

        if (!target) return message.reply('Mencione o usuário para remover moedas.');
        if (!amount || amount <= 0) return message.reply('Digite um valor válido.');

        let data = {};
        if (fs.existsSync(ECONOMY_PATH)) data = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));

        if (!data[target.id]) data[target.id] = 0;

        data[target.id] -= amount;
        if (data[target.id] < 0) data[target.id] = 0;

        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(data, null, 2));

        // Log resumido
        sendLog(client, "economy", { userId: target.id, amount: data[target.id] });

        // Incrementa contador e envia backup a cada 20 alterações
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

        message.reply(`✅ Removidas **${amount} moedas** de ${target.user.tag}. Agora ele tem **${data[target.id]} moedas**.`);
    },
};
