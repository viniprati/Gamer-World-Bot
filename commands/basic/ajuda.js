const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ajuda',
    description: 'Lista todos os comandos disponíveis.',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Comandos do Gamer World Bot')
            .setDescription('Aqui está a lista de todos os meus comandos:')
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${message.author.tag}` });

        const commandFolders = fs.readdirSync(path.join(__dirname, '../../commands'));

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(path.join(__dirname, '../../commands', folder)).filter(file => file.endsWith('.js'));
            let commandsInFolder = '';
            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`);
                commandsInFolder += `\`!${command.name}\` - ${command.description}\n`;
            }
            if (commandsInFolder) {
                embed.addFields({ name: folder.charAt(0).toUpperCase() + folder.slice(1) + ' Comandos', value: commandsInFolder, inline: false });
            }
        }

        message.channel.send({ embeds: [embed] });
    },
};