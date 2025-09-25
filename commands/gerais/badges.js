const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
// Importa a função do nosso arquivo de lógica (sem alterações aqui)
const { getAllBadges } = require('../../utils/badgeManager.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('badges')
        .setDescription('Mostra todas as insígnias disponíveis no bot e como consegui-las.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'badges',
    description: 'Mostra todas as insígnias disponíveis no bot e como consegui-las.',
    cooldown: 30,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // O resto do seu código funciona perfeitamente sem nenhuma alteração.
        const allBadgesList = getAllBadges();

        if (allBadgesList.length === 0) {
            return reply({ content: 'Nenhuma insígnia configurada no momento.' });
        }

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('📜 Catálogo de Insígnias do Servidor')
            .setDescription('Complete os objetivos para colecionar estas insígnias e exibi-las em seu perfil!')
            .addFields(allBadgesList)
            .setTimestamp()
            .setFooter({ text: 'Boa sorte, colecionador!' });
            
        // Usa a função de resposta unificada
        await reply({ embeds: [embed] });
    },
};