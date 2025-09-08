const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

        const commandsPath = path.join(__dirname, '../../commands');
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            if (!fs.lstatSync(folderPath).isDirectory()) continue;

            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            if (commandFiles.length === 0) continue;

            let commandsInFolder = '';
            for (const file of commandFiles) {
                const command = require(path.join(folderPath, file));

                const name = command.name || path.parse(file).name; // fallback pro nome do arquivo
                const desc = command.description || 'Sem descrição';

                commandsInFolder += `\`!${name}\` - ${desc}\n`;
            }

            if (!commandsInFolder.trim()) commandsInFolder = 'Nenhum comando disponível.';

            embed.addFields(
                {
                    name: `📂 ${folder.charAt(0).toUpperCase() + folder.slice(1)} Comandos`,
                    value: commandsInFolder,
                    inline: false
                }
            );
        }

        message.channel.send({ embeds: [embed] });
    },
};
