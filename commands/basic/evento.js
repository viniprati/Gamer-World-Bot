const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'evento',
    description: 'Evento de Clash Royale com botão de inscrição.',
    async execute(message, args, client) {
        // Configuração do evento
        const nomeEvento = "Torneio Clash Royale";
        const dataEvento = "20/09/2025 às 18:00 BRT";
        const descricaoEvento = "Mostre suas habilidades no Clash Royale! Premiação para os top 3 do torneio.";
        const linkInscricao = "https://link-para-inscricao.com";
        const imagemEvento = "https://i.imgur.com/ClashRoyale.png"; // substitua por uma imagem real

        const embed = new EmbedBuilder()
            .setColor('#FF5733')
            .setTitle(`🏆 Próximo Evento: ${nomeEvento}`)
            .setDescription(descricaoEvento)
            .addFields(
                { name: '📅 Data e Hora', value: dataEvento, inline: false },
                { name: '🔗 Link para Inscrição', value: `[Clique aqui](${linkInscricao})`, inline: false }
            )
            .setImage(imagemEvento)
            .setTimestamp()
            .setFooter({ text: 'Clique no botão abaixo para se inscrever!' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('inscrever_clash')
                    .setLabel('📝 Inscrever-se')
                    .setStyle(ButtonStyle.Success)
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = i => i.customId === 'inscrever_clash';
        const collector = msg.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 }); // 24h

        const participantesPath = path.join(__dirname, '../../participantes.json');
        if (!fs.existsSync(participantesPath)) fs.writeFileSync(participantesPath, JSON.stringify({}));

        collector.on('collect', async i => {
            const data = JSON.parse(fs.readFileSync(participantesPath, 'utf8'));
            const userId = i.user.id;

            if (!data[nomeEvento]) data[nomeEvento] = [];

            if (data[nomeEvento].includes(userId)) {
                return i.reply({ content: 'Você já está inscrito neste evento!', ephemeral: true });
            }

            data[nomeEvento].push(userId);
            fs.writeFileSync(participantesPath, JSON.stringify(data, null, 2));

            i.reply({ content: `✅ Você se inscreveu no evento **${nomeEvento}**!`, ephemeral: true });
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    },
};
