const { EmbedBuilder } = require('discord.js');
// Importa a função do nosso arquivo de lógica
const { getAllBadges } = require('./badgeManager.js');

module.exports = {
    name: 'badges',
    description: 'Mostra todas as insígnias disponíveis no bot e como consegui-las.',
    cooldown: 30,
    async execute(message, args, client) {
        const allBadgesList = getAllBadges();

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('📜 Catálogo de Insígnias do Servidor')
            .setDescription('Complete os objetivos para colecionar estas insígnias e exibi-las em seu perfil!')
            .addFields(allBadgesList)
            .setTimestamp()
            .setFooter({ text: 'Boa sorte, colecionador!' });
            
        message.channel.send({ embeds: [embed] });
    },
};