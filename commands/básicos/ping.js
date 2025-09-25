const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Mostra a latência do bot e da API do Discord.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'ping',
    description: 'Mostra a latência do bot e da API do Discord.',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        const reply = async (options) => {
            return isSlash ? await interactionOrMessage.reply(options) : await interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // O resto do código usa a função unificada 'reply'.
        
        // Mensagem inicial para calcular a latência de envio
        const sent = await reply({ content: 'Ping...', fetchReply: true });

        // Calcula as latências
        const wsLatency = Math.round(client.ws.ping);
        const apiLatency = sent.createdTimestamp - (isSlash ? interactionOrMessage.createdTimestamp : interactionOrMessage.createdTimestamp);

        // Edita a mensagem inicial com o resultado
        const responseContent = `🏓 **Pong!**\nLatência do WebSocket: \`${wsLatency}ms\`\nLatência da API: \`${apiLatency}ms\``;

        if (isSlash) {
            await interactionOrMessage.editReply({ content: responseContent });
        } else {
            await sent.edit({ content: responseContent });
        }
    },
};