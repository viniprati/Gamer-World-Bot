const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');

// Caminhos para os arquivos
const ECONOMY_PATH = path.join(__dirname, '../../economy.json');
const VIPS_PATH = path.join(__dirname, '../../vips.json');

// Funções de leitura/escrita de JSON
function loadJsonSafe(filePath, fallback) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
            return fallback;
        }
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
        console.error('Erro ao ler/criar JSON:', filePath, err);
        return fallback;
    }
}

function saveJsonSafe(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Erro ao salvar JSON:', filePath, err);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loja')
        .setDescription('Loja oficial de VIPs do servidor.'),

    name: 'loja',
    description: 'Loja oficial de VIPs do servidor.',
    cooldown: 15,

    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.channel.send(options);
        };
        const guild = isSlash ? interactionOrMessage.guild : interactionOrMessage.guild;

        // --- CONFIGURAÇÃO DE PREÇOS E CARGOS (AJUSTE AQUI) ---
        const CONFIG = {
            roles: {
                prime: '1483811823928213555', 
                gamer: '1483811742252269699'
            },
            prices: {
                prime_1: 350000,  // 350k Mensal
                prime_3: 900000,  // Exemplo trimestral (ajuste como quiser)
                gamer_1: 500000,  // 500k Mensal
                gamer_3: 1300000  // Exemplo trimestral (ajuste como quiser)
            }
        };

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏪 Loja VIP Premium')
            .setDescription('Adquira seu plano VIP usando suas **Gamecoins**! Selecione o plano abaixo para ver detalhes.')
            .addFields(
                { 
                    name: '👑 VIP Gamer', 
                    value: `> **Mensal:** ${CONFIG.prices.gamer_1.toLocaleString()} GC\n> **Trimestral:** ${CONFIG.prices.gamer_3.toLocaleString()} GC\n*Benefícios:* 4x XP, 3x em sorteios, call personalizada (30 slots), cargo máximo.`, 
                    inline: false 
                },
                { 
                    name: '⭐ VIP Prime', 
                    value: `> **Mensal:** ${CONFIG.prices.prime_1.toLocaleString()} GC\n> **Trimestral:** ${CONFIG.prices.prime_3.toLocaleString()} GC\n*Benefícios:* 3x XP, 2x em sorteios, chats exclusivos, call para 20 membros.`, 
                    inline: false 
                }
            )
            .setFooter({ text: 'Acumule Gamecoins jogando e garanta suas vantagens!' });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('select_vip')
            .setPlaceholder('Selecione um plano VIP...')
            .addOptions(
                { label: '⭐ VIP Prime (1 Mês)', description: `${CONFIG.prices.prime_1.toLocaleString()} Gamecoins`, value: 'prime_1' },
                { label: '⭐ VIP Prime (3 Meses)', description: `${CONFIG.prices.prime_3.toLocaleString()} Gamecoins`, value: 'prime_3' },
                { label: '👑 VIP Gamer (1 Mês)', description: `${CONFIG.prices.gamer_1.toLocaleString()} Gamecoins`, value: 'gamer_1' },
                { label: '👑 VIP Gamer (3 Meses)', description: `${CONFIG.prices.gamer_3.toLocaleString()} Gamecoins`, value: 'gamer_3' }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await reply({ embeds: [embed], components: [row] });
        const message = isSlash ? await interactionOrMessage.fetchReply() : response;

        const collector = message.createMessageComponentCollector({ time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            if (i.user.id !== (isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id)) {
                return i.reply({ content: '❌ Esta loja não foi aberta para você.', ephemeral: true });
            }

            const vipRoles = {
                prime_1: { id: CONFIG.roles.prime, price: CONFIG.prices.prime_1, durationDays: 30, name: '⭐ VIP Prime (1 Mês)' },
                prime_3: { id: CONFIG.roles.prime, price: CONFIG.prices.prime_3, durationDays: 90, name: '⭐ VIP Prime (3 Meses)' },
                gamer_1: { id: CONFIG.roles.gamer, price: CONFIG.prices.gamer_1, durationDays: 30, name: '👑 VIP Gamer (1 Mês)' },
                gamer_3: { id: CONFIG.roles.gamer, price: CONFIG.prices.gamer_3, durationDays: 90, name: '👑 VIP Gamer (3 Meses)' }
            };

            const choice = i.values[0];
            const vip = vipRoles[choice];
            
            const economy = loadJsonSafe(ECONOMY_PATH, {});
            const userId = i.user.id;
            
            // Pega o saldo tratando se o JSON salva apenas o número ou um objeto { balance: X }
            let balance = 0;
            if (typeof economy[userId] === 'object') {
                balance = economy[userId].balance || 0;
            } else {
                balance = economy[userId] || 0;
            }

            if (balance < vip.price) {
                return i.reply({ 
                    content: `❌ Saldo insuficiente!\n💰 Seu saldo: **${balance.toLocaleString()} GC**\n🛒 Preço: **${vip.price.toLocaleString()} GC**`, 
                    ephemeral: true 
                });
            }

            // Desconto
            if (typeof economy[userId] === 'object') {
                economy[userId].balance -= vip.price;
            } else {
                economy[userId] -= vip.price;
            }
            saveJsonSafe(ECONOMY_PATH, economy);

            const member = await guild.members.fetch(userId).catch(() => null);
            const role = guild.roles.cache.get(vip.id);

            if (!role || !member) {
                return i.reply({ content: '❌ Erro ao processar cargo. Verifique se o ID do cargo está correto.', ephemeral: true });
            }

            await member.roles.add(role).catch(() => {});

            // Lógica de Expiração no vips.json
            let vips = loadJsonSafe(VIPS_PATH, []);
            const now = Date.now();
            const timeToAdd = vip.durationDays * 24 * 60 * 60 * 1000;
            const existingIndex = vips.findIndex(e => e.userId === userId && e.roleId === vip.id);
            
            let expiresAt;
            if (existingIndex !== -1) {
                expiresAt = Math.max(vips[existingIndex].expiresAt, now) + timeToAdd;
                vips[existingIndex].expiresAt = expiresAt;
            } else {
                expiresAt = now + timeToAdd;
                vips.push({ userId, guildId: guild.id, roleId: vip.id, expiresAt });
            }
            
            saveJsonSafe(VIPS_PATH, vips);
            sendLog(client, "vip", { userId, vipName: vip.name });

            i.reply({ 
                content: `✅ **Compra realizada!**\nVocê adquiriu **${vip.name}**.\n⏳ Expira em: <t:${Math.floor(expiresAt / 1000)}:f>`, 
                ephemeral: true 
            });
        });

        collector.on('end', () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                StringSelectMenuBuilder.from(selectMenu).setDisabled(true).setPlaceholder('Sessão expirada.')
            );
            message.edit({ components: [disabledRow] }).catch(() => {});
        });
    },
};