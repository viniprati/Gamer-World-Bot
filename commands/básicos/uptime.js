const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require('ms');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Mostra há quanto tempo o bot está online.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'uptime',
    description: 'Mostra há quanto tempo o bot está online.',
    cooldown: 10,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // A lógica do comando permanece a mesma.
        const uptime = ms(client.uptime, { long: true });

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('📈 Status Operacional')
            .setDescription(`Estou online e operando normalmente há **${uptime}**.`)
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${isSlash ? interactionOrMessage.user.username : interactionOrMessage.author.username}`});

        await reply({ embeds: [embed] });
    },
};