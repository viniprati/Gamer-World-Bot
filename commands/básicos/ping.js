module.exports = {
    name: 'ping',
    description: 'Verifica o ping do bot.',
    async execute(message, args, client) {
        const sent = await message.reply('Pong!');
        sent.edit(`Pong! Latência do Bot: ${sent.createdTimestamp - message.createdTimestamp}ms. Latência da API: ${client.ws.ping}ms.`);
    },
};