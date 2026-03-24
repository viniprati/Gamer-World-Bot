const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');
const { loadEconomy, saveEconomy, getBalance, setBalance } = require('../../utils/economyManager');
const { getConfig } = require('../../utils/config');

const VIPS_PATH = path.join(__dirname, '../../vips.json');

const CONFIG = {
    roles: {
        prime: getConfig('VIP_ROLE_PRIME', '1483811823928213555'),
        gamer: getConfig('VIP_ROLE_GAMER', '1483811742252269699')
    },
    prices: {
        prime_1: Number(getConfig('VIP_PRICE_PRIME_1', 350000)),
        prime_3: Number(getConfig('VIP_PRICE_PRIME_3', 900000)),
        gamer_1: Number(getConfig('VIP_PRICE_GAMER_1', 500000)),
        gamer_3: Number(getConfig('VIP_PRICE_GAMER_3', 1300000))
    }
};

function loadVips() {
    if (!fs.existsSync(VIPS_PATH)) return [];
    try {
        const raw = fs.readFileSync(VIPS_PATH, 'utf8');
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveVips(data) {
    fs.writeFileSync(VIPS_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loja')
        .setDescription('Loja oficial de VIPs do servidor.'),

    name: 'loja',
    description: 'Loja oficial de VIPs do servidor.',
    cooldown: 15,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const guild = interactionOrMessage.guild;
        const requesterId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('Loja VIP')
            .setDescription('Selecione um plano VIP para comprar com Gamecoins.')
            .addFields(
                { name: 'VIP Gamer', value: `Mensal: ${CONFIG.prices.gamer_1.toLocaleString()} GC\nTrimestral: ${CONFIG.prices.gamer_3.toLocaleString()} GC` },
                { name: 'VIP Prime', value: `Mensal: ${CONFIG.prices.prime_1.toLocaleString()} GC\nTrimestral: ${CONFIG.prices.prime_3.toLocaleString()} GC` }
            );

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_vip')
            .setPlaceholder('Selecione um plano VIP...')
            .addOptions(
                { label: 'VIP Prime (1 mes)', description: `${CONFIG.prices.prime_1.toLocaleString()} Gamecoins`, value: 'prime_1' },
                { label: 'VIP Prime (3 meses)', description: `${CONFIG.prices.prime_3.toLocaleString()} Gamecoins`, value: 'prime_3' },
                { label: 'VIP Gamer (1 mes)', description: `${CONFIG.prices.gamer_1.toLocaleString()} Gamecoins`, value: 'gamer_1' },
                { label: 'VIP Gamer (3 meses)', description: `${CONFIG.prices.gamer_3.toLocaleString()} Gamecoins`, value: 'gamer_3' }
            );

        const response = await reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
        const message = isSlash ? await interactionOrMessage.fetchReply() : response;

        const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });
        collector.on('collect', async i => {
            if (i.user.id !== requesterId) {
                return i.reply({ content: 'Esta loja nao foi aberta para voce.', ephemeral: true });
            }

            const vipRoles = {
                prime_1: { id: CONFIG.roles.prime, price: CONFIG.prices.prime_1, durationDays: 30, name: 'VIP Prime (1 mes)' },
                prime_3: { id: CONFIG.roles.prime, price: CONFIG.prices.prime_3, durationDays: 90, name: 'VIP Prime (3 meses)' },
                gamer_1: { id: CONFIG.roles.gamer, price: CONFIG.prices.gamer_1, durationDays: 30, name: 'VIP Gamer (1 mes)' },
                gamer_3: { id: CONFIG.roles.gamer, price: CONFIG.prices.gamer_3, durationDays: 90, name: 'VIP Gamer (3 meses)' }
            };

            const vip = vipRoles[i.values[0]];
            const economy = loadEconomy();
            const balance = getBalance(economy, i.user.id);
            if (balance < vip.price) {
                return i.reply({ content: `Saldo insuficiente. Seu saldo: ${balance.toLocaleString()} GC.`, ephemeral: true });
            }

            setBalance(economy, i.user.id, balance - vip.price);
            saveEconomy(economy, client);

            const member = await guild.members.fetch(i.user.id).catch(() => null);
            const role = guild.roles.cache.get(vip.id);
            if (!role || !member) {
                return i.reply({ content: 'Erro ao aplicar cargo VIP.', ephemeral: true });
            }

            await member.roles.add(role).catch(() => {});
            const now = Date.now();
            const timeToAdd = vip.durationDays * 24 * 60 * 60 * 1000;
            const vips = loadVips();
            const existingIndex = vips.findIndex(entry => entry.userId === i.user.id && entry.roleId === vip.id);

            let expiresAt;
            if (existingIndex >= 0) {
                expiresAt = Math.max(vips[existingIndex].expiresAt, now) + timeToAdd;
                vips[existingIndex].expiresAt = expiresAt;
            } else {
                expiresAt = now + timeToAdd;
                vips.push({ userId: i.user.id, guildId: guild.id, roleId: vip.id, expiresAt });
            }
            saveVips(vips);

            await sendLog(client, 'vip', { userId: i.user.id, vipName: vip.name });
            return i.reply({
                content: `Compra realizada: **${vip.name}**.\nExpira em: <t:${Math.floor(expiresAt / 1000)}:f>`,
                ephemeral: true
            });
        });

        collector.on('end', () => {
            const disabled = StringSelectMenuBuilder.from(selectMenu).setDisabled(true).setPlaceholder('Sessao expirada.');
            message.edit({ components: [new ActionRowBuilder().addComponents(disabled)] }).catch(() => {});
        });
    },
};
