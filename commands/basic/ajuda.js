const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ajuda',
    description: 'Lista todos os comandos disponíveis.',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📖 Comandos do Gamer World Bot')
            .setDescription('Aqui está a lista de todos os meus comandos:')
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${message.author.tag}` });

        // Agrupa os comandos por pasta (se quiser)
        const categories = {};

        client.commands.forEach(cmd => {
            // pega a categoria a partir do caminho do arquivo
            const parts = cmd.__filename?.split(path.sep) || [];
            const folder = parts[parts.length - 2] || 'Outros';

            if (!categories[folder]) categories[folder] = [];
            categories[folder].push(cmd);
        });

        for (const [folder, cmds] of Object.entries(categories)) {
            const commandsList = cmds.map(c => `\`!${c.name}\` - ${c.description || 'Sem descrição'}`).join('\n');
            embed.addFields({
                name: folder.charAt(0).toUpperCase() + folder.slice(1),
                value: commandsList,
                inline: false
            });
        }

        message.channel.send({ embeds: [embed] });
    },
};
