const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'loja',
    description: 'Mostra a loja de VIPs e permite comprar pelo menu.',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏪 Loja de VIPs')
            .setDescription('Selecione abaixo o VIP que deseja comprar.\nVocê precisa ter moedas suficientes.')
            .addFields(
                { name: '💎 VIP Diamante — 200000 moedas', value: 'Benefícios: +2 VIP Ouro, XP 2.5x, pay 10h, 7 sorteios', inline: false },
                { name: '🥇 VIP Ouro — 120000 moedas', value: 'Benefícios: XP 2.0x, pay 4h, fotos, 5 sorteios', inline: false },
                { name: '🥈 VIP Prata — 80000 moedas', value: 'Benefícios: XP 1.5x, pay 2h, categoria VIP, 2 sorteios', inline: false }
            )
            .setFooter({ text: 'Economize suas moedas e garanta seu VIP!' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_vip')
            .setPlaceholder('Selecione um VIP...')
            .addOptions(
                { label: '🥈 VIP Prata', description: 'Custa 80000 moedas', value: 'prata' },
                { label: '🥇 VIP Ouro', description: 'Custa 120000 moedas', value: 'ouro' },
                { label: '💎 VIP Diamante', description: 'Custa 200000 moedas', value: 'diamante' }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const msg = await message.channel.send({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId !== 'select_vip') return;

            const vipRoles = {
                prata: { id: '1389915201641512960', price: 80000, name: '🥈 VIP Prata' },
                ouro: { id: '1389915441157115934', price: 120000, name: '🥇 VIP Ouro' },
                diamante: { id: '1389915552084004884', price: 200000, name: '💎 VIP Diamante' }
            };

            const choice = i.values[0];
            const vip = vipRoles[choice];
            if (!vip) return;

            const filePath = path.join(__dirname, '../../economy.json');
            let data = {};
            if (fs.existsSync(filePath)) data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

            const userId = i.user.id;
            if (!data[userId]) data[userId] = 0;

            if (data[userId] < vip.price) {
                return i.reply({ content: `❌ Você não tem moedas suficientes para comprar ${vip.name}.`, ephemeral: true });
            }

            data[userId] -= vip.price;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            const member = await message.guild.members.fetch(userId);
            const role = message.guild.roles.cache.get(vip.id);
            if (!role) return i.reply({ content: '❌ Cargo VIP não encontrado no servidor.', ephemeral: true });

            await member.roles.add(role);
            i.reply({ content: `✅ Parabéns! Você comprou ${vip.name} por **${vip.price} moedas** 🎉`, ephemeral: true });
        });

        collector.on('end', () => {
            msg.edit({ components: [] });
        });
    },
};
