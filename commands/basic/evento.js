const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'evento',
    description: 'Mostra informações sobre o próximo evento gamer.',
    async execute(message, args, client) {
        // Você pode configurar estas informações em um arquivo de configuração ou puxar de uma API
        const nomeEvento = "Torneio de LoL - Copa Nexus";
        const dataEvento = "15/08/2024 às 19:00 BRT";
        const descricaoEvento = "Preparem-se para a batalha! Reúnam seus times e mostrem quem é o melhor na Copa Nexus. Premiação para os top 3!";
        const linkInscricao = "https://link-para-inscricao.com";
        const imagemEvento = "https://i.imgur.com/example-event-image.png"; // Substitua por uma imagem real

        const embed = new EmbedBuilder()
            .setColor('#FF5733') // Cor laranja para eventos gamer
            .setTitle(`🏆 Próximo Evento: ${nomeEvento}`)
            .setDescription(descricaoEvento)
            .addFields(
                { name: '📅 Data e Hora', value: dataEvento, inline: false },
                { name: '🔗 Link para Inscrição', value: `[Clique aqui para se inscrever](${linkInscricao})`, inline: false }
            )
            .setImage(imagemEvento)
            .setTimestamp()
            .setFooter({ text: 'Não perca! Boas festas a todos os gamers!' });

        message.channel.send({ embeds: [embed] });
        message.channel.send("A imagem do evento é:");
},
};