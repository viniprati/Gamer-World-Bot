// ADICIONADO: ActionRowBuilder e StringSelectMenuBuilder
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'ajuda',
    aliases: ['help', 'comandos'],
    description: 'Mostra uma lista interativa de todos os comandos.',
    cooldown: 10,
    async execute(message, args, client) {
        const commandsPath = path.join(__dirname, '..', '..', 'commands');
        const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
            fs.lstatSync(path.join(commandsPath, folder)).isDirectory()
        );

        // --- ESTRUTURA PARA ARMAZENAR OS COMANDOS POR CATEGORIA ---
        const categories = {};
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            const commandsList = commandFiles
                .map(file => {
                    try {
                        const command = require(path.join(folderPath, file));
                        if (command.name && command.description) {
                            return `\`${prefix}${command.name}\` - ${command.description}`;
                        }
                    } catch {}
                    return null;
                })
                .filter(Boolean) // Remove os nulos
                .join('\n');

            if (commandsList) {
                const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
                categories[categoryName] = commandsList;
            }
        }

        // --- CRIANDO O MENU DE SELEÇÃO ---
        const menuOptions = Object.keys(categories).map(category => ({
            label: `Comandos de ${category}`,
            value: category,
            description: `Veja os comandos da categoria ${category}.`
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Selecione uma categoria...')
            .addOptions(menuOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // --- EMBED INICIAL ---
        const initialEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('📖 Central de Ajuda do Gamer World Bot')
            .setDescription('Olá! Eu sou o bot oficial do servidor.\n\nSelecione uma das categorias abaixo para ver a lista de comandos correspondentes. O menu ficará ativo por 5 minutos.')
            .setThumbnail(client.user.displayAvatarURL());

        const response = await message.channel.send({
            embeds: [initialEmbed],
            components: [row]
        });

        // --- COLETOR DE INTERAÇÕES DO MENU ---
        const collector = response.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutos
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Apenas o autor do comando pode usar este menu.', ephemeral: true });
            }

            const selectedCategory = interaction.values[0];
            const commandsText = categories[selectedCategory];

            const categoryEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`📂 Comandos de ${selectedCategory}`)
                .setDescription(commandsText)
                .setTimestamp()
                .setFooter({ text: `Solicitado por ${message.author.tag}` });

            // Atualiza a mensagem com os comandos da categoria selecionada
            await interaction.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', () => {
            // Remove o menu quando o tempo expira
            response.edit({ components: [] }).catch(() => {});
        });
    },
};