const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { prefix } = require('../../config.json');

const categoryEmojis = {
    'Básicos': '⚙️',
    'Economia': '💰',
    'Gerais': '🌐',
    'Moderação': '🛡️'
};

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

        const categories = {};
        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
            
            const commandsList = commandFiles
                .map(file => {
                    try {
                        const command = require(path.join(folderPath, file));
                        if (command.name && command.description) {
                            return `**\`${prefix}${command.name}\`**\n*${command.description}*`;
                        }
                    } catch {}
                    return null;
                })
                .filter(Boolean)
                .join('\n\n');

            if (commandsList) {
                const categoryName = folder.charAt(0).toUpperCase() + folder.slice(1);
                categories[categoryName] = commandsList;
            }
        }

        const menuOptions = Object.keys(categories).map(category => ({
            label: `${category}`,
            value: category,
            description: `Veja os comandos da categoria ${category}.`,
            emoji: categoryEmojis[category] || '📁'
        }));
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Escolha uma categoria de comandos...')
            .addOptions(menuOptions);
            
        const homeButton = new ButtonBuilder()
            .setCustomId('home_button')
            .setLabel('Página Inicial')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🏠');

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const homeRow = new ActionRowBuilder().addComponents(homeButton);

        const initialEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🎮 Central de Comandos - ${message.guild.name}`)
            .setDescription('Bem-vindo à central de ajuda!\n\nUse o menu abaixo para navegar pelas diferentes categorias de comandos e descobrir tudo que eu posso fazer.')
            .setThumbnail(message.guild.iconURL({ dynamic: true }))
            .setFooter({ text: 'Este menu expira em 5 minutos.' });

        const response = await message.channel.send({
            embeds: [initialEmbed],
            components: [row]
        });

        // --- COLETOR DE INTERAÇÕES CORRIGIDO ---
        const collector = response.createMessageComponentCollector({
            // A linha 'componentType' foi REMOVIDA.
            time: 5 * 60 * 1000 // 5 minutos
        });

        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ content: 'Apenas o autor do comando pode usar este menu.', ephemeral: true });
            }
            
            if (interaction.isButton() && interaction.customId === 'home_button') {
                await interaction.update({ embeds: [initialEmbed], components: [row] });
                return;
            }

            if (interaction.isStringSelectMenu()) {
                const selectedCategory = interaction.values[0];
                const commandsText = categories[selectedCategory];
                const categoryEmoji = categoryEmojis[selectedCategory] || '📁';

                const categoryEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`${categoryEmoji} Comandos de ${selectedCategory}`)
                    .setDescription(commandsText)
                    .setTimestamp()
                    .setFooter({ text: `Solicitado por ${message.author.tag}` });
                    
                await interaction.update({ embeds: [categoryEmbed], components: [row, homeRow] });
            }
        });

        collector.on('end', () => {
            const expiredEmbed = new EmbedBuilder()
                .setColor('#95a5a6')
                .setTitle('📖 Central de Ajuda')
                .setDescription('Este menu de ajuda expirou. Por favor, use o comando `!ajuda` novamente se precisar.');
            response.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
        });
    },
};