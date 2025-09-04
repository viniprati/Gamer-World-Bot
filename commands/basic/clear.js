const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'Apaga um número específico de mensagens do chat.',
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('Você não tem permissão para usar este comando.');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount <= 0 || amount > 100) {
            return message.reply('Por favor, forneça um número entre 1 e 100 para deletar.');
        }

        try {
            await message.channel.bulkDelete(amount, true);
            message.channel.send(`Foram apagadas ${amount} mensagens.`).then(msg => {
                setTimeout(() => msg.delete(), 5000); // Apaga a mensagem de confirmação após 5 segundos
            });
        } catch (error) {
            console.error(error);
            message.reply('Não foi possível apagar as mensagens. Verifique minhas permissões e se as mensagens não são muito antigas (mais de 14 dias).');
        }
    },
};