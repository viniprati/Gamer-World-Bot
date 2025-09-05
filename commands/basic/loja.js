const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'loja',
    description: 'Mostra a loja de VIPs do servidor com botões de compra.',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏪 Loja de VIPs')
            .setDescription('Clique no botão correspondente para comprar seu VIP!\nVocê precisa ter moedas suficientes.')
            .setTimestamp()
            .setFooter({ text: 'Economize suas moedas e garanta seu VIP!' });

        embed.addFields(
            {
                name: '💎 VIP Diamante',
                value: `☆ Benefícios ☆\n- Acesso a todos benefícios do VIP Ouro\n- Tempo de pay: 10 horas\n- Pode dar um VIP Ouro de 15 dias para duas pessoas\n- Multiplicador de XP: 2,5\n- 7 entradas extras em sorteios`,
                inline: false
            },
            {
                name: '🥇 VIP Ouro',
                value: `☆ Benefícios ☆\n- Acesso a todos os benefícios do VIP Prata\n- Tempo de pay: 4 horas\n- Permissão pra enviar fotos\n- Multiplicador de XP: 2,0\n- 5 entradas extras em sorteios`,
                inline: false
            },
            {
                name: '🥈 VIP Prata',
                value: `☆ Benefícios ☆\n- Acesso à categoria VIP\n- Sorteios exclusivos\n- Tempo de pay: 2 horas\n- Multiplicador de XP: 1,5\n- 2 entradas extras em sorteios`,
                inline: false
            }
        );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('vip_prata')
                    .setLabel('🥈 Comprar Prata')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('vip_ouro')
                    .setLabel('🥇 Comprar Ouro')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('vip_diamante')
                    .setLabel('💎 Comprar Diamante')
                    .setStyle(ButtonStyle.Danger)
            );

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            const vipRoles = {
                vip_prata: { id: '1389915201641512960', price: 80000, name: '🥈 VIP Prata' },
                vip_ouro: { id: '1389915441157115934', price: 120000, name: '🥇 VIP Ouro' },
                vip_diamante: { id: '1389915552084004884', price: 200000, name: '💎 VIP Diamante' }
            };

            const vip = vipRoles[i.customId];
            if (!vip) return;

            const filePath = path.join(__dirname, '../../economy.json');
            let data = {};
            if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            const userId = message.author.id;
            if (!data[userId]) data[userId] = 0;

            if (data[userId] < vip.price) {
                return i.reply({ content: `Você não tem moedas suficientes para comprar ${vip.name}!`, ephemeral: true });
            }

            data[userId] -= vip.price;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            const member = await message.guild.members.fetch(userId);
            const role = message.guild.roles.cache.get(vip.id);
            if (!role) return i.reply({ content: 'Cargo VIP não encontrado no servidor.', ephemeral: true });

            await member.roles.add(role);
            i.reply({ content: `Parabéns! Você comprou ${vip.name} por **${vip.price} moedas** 🎉`, ephemeral: true });
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    },
};
