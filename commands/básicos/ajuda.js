const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('../../utils/config');
const prefix = getConfig('PREFIX', '!');

const categoryEmojis = {
    'Básicos': '⚙️',
    'Economia': '💰',
    'Gerais': '🌐',
    'Moderação': '🛡️',
    'premiumBot': '🌟' // Adicione outras categorias se necessário
};

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('ajuda')
        .setDescription('Mostra uma lista interativa de todos os comandos.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'ajuda',
    aliases: ['help', 'comandos'],
    description: 'Mostra uma lista interativa de todos os comandos.',
    cooldown: 10,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

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
                        // Prioriza a descrição do slash command se existir
                        const description = command.data?.description || command.description;
                        if (command.name && description) {
                            return `**\`${prefix}${command.name}\`**\n*${description}*`;
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
            .setTitle(`🎮 Central de Comandos - ${guild.name}`) // Alterado
            .setDescription('Bem-vindo à central de ajuda!\n\nUse o menu abaixo para navegar pelas diferentes categorias de comandos e descobrir tudo que eu posso fazer.')
            .setThumbnail(guild.iconURL({ dynamic: true })) // Alterado
            .setFooter({ text: 'Este menu expira em 5 minutos.' });

        const response = await reply({
            embeds: [initialEmbed],
            components: [row]
        });
        
        const message = isSlash ? await interactionOrMessage.fetchReply() : response;

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000 // 5 minutos
        });

        collector.on('collect', async (interaction) => {
            // A verificação de permissão agora usa a variável unificada 'author'
            if (interaction.user.id !== author.id) {
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
                    .setFooter({ text: `Solicitado por ${author.tag}` }); // Alterado
                    
                await interaction.update({ embeds: [categoryEmbed], components: [row, homeRow] });
            }
        });

        collector.on('end', () => {
            const expiredEmbed = new EmbedBuilder()
                .setColor('#95a5a6')
                .setTitle('📖 Central de Ajuda')
                .setDescription('Este menu de ajuda expirou. Por favor, use o comando `!ajuda` ou `/ajuda` novamente se precisar.');
            message.edit({ embeds: [expiredEmbed], components: [] }).catch(() => {});
        });
    },
};
