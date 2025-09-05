const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'loja',
    description: 'Mostra a loja de VIPs do servidor.',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏪 Loja de VIPs')
            .setDescription('Troque suas moedas por VIPs exclusivos!\nUse `!buy <vip>` para comprar.')
            .setTimestamp()
            .setFooter({ text: 'Economize suas moedas e garanta seu VIP!' });

        embed.addFields(
            { name: '🥈 VIP Prata', value: 'Preço: **80000 moedas**\nBenefícios: Cargos especiais.', inline: false },
            { name: '🥇 VIP Ouro', value: 'Preço: **120000 moedas**\nBenefícios: Todos do Prata + prioridade em eventos.', inline: false },
            { name: '💎 VIP Diamante', value: 'Preço: **200000 moedas**\nBenefícios: Todos do Ouro + destaque no servidor.', inline: false }
        );

        message.channel.send({ embeds: [embed] });
    },
};
