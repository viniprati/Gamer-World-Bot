const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Mostra informações sobre o servidor atual.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'server',
    description: 'Mostra informações sobre o servidor.',
    
    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        // Unifica como obter o autor, o servidor (guild) e o método de resposta
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        if (!guild) {
            return isSlash 
                ? reply({ content: 'Este comando só pode ser usado em um servidor.', ephemeral: true })
                : reply('Este comando só pode ser usado em um servidor.');
        }

        // A partir daqui, o código usa as variáveis unificadas.
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`Informações do Servidor: ${guild.name}`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Nome do Servidor', value: guild.name, inline: true },
                { name: 'ID do Servidor', value: guild.id, inline: true },
                { name: 'Membros', value: guild.memberCount.toString(), inline: true },
                { name: 'Dono', value: `<@${guild.ownerId}>`, inline: true },
                { name: 'Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:f>`, inline: true }, // Formato de data melhorado
                { name: 'Cargos', value: guild.roles.cache.size.toString(), inline: true }
            )
            .setTimestamp()
            .setFooter({ text: `Solicitado por ${author.tag}` }); // Alterado para usar a variável 'author'

        // Usa a função de resposta unificada
        await reply({ embeds: [embed] });
    },
};