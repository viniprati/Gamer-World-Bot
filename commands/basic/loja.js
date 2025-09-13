const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ECONOMY_PATH = path.join(__dirname, '../../economy.json');
const VIPS_PATH = path.join(__dirname, '../../vips.json');
const { sendLog } = require('../../logger');

// Funções de leitura/escrita de JSON (mantidas)
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
    name: 'loja',
    description: 'Mostra a loja de VIPs e permite comprar pelo menu.',
    cooldown: 15, // Adicionado um cooldown para prevenir spam
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏪 Loja de VIPs')
            .setDescription('Selecione abaixo o VIP que deseja comprar. Você precisa ter moedas suficientes.')
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

        const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            if (i.customId !== 'select_vip') return;

            const vipRoles = {
                prata: { id: '1389915201641512960', price: 80000, name: '🥈 VIP Prata' },
                ouro: { id: '1389915441157115934', price: 120000, name: '🥇 VIP Ouro' },
                diamante: { id: '1389915552084004884', price: 200000, name: '💎 VIP Diamante' }
            };

            const choice = i.values[0];
            const vip = vipRoles[choice];
            if (!vip) return i.reply({ content: 'Opção inválida.', flags: [MessageFlags.Ephemeral] });

            const economy = loadJsonSafe(ECONOMY_PATH, {});
            const userId = i.user.id;
            const userData = economy[userId];

            // A CORREÇÃO DEFINITIVA: LÓGICA DE LEITURA INTELIGENTE
            // Garante que 'balance' será sempre um número, não importa o que esteja no JSON.
            const balance = (userData && userData.balance) || userData || 0;

            if (balance < vip.price) {
                return i.reply({ content: `❌ Você não tem moedas suficientes. (Saldo: ${balance.toLocaleString('pt-BR')})`, flags: [MessageFlags.Ephemeral] });
            }

            // A matemática agora é segura
            const newBalance = balance - vip.price;
            
            // Salva sempre como um número simples, mantendo o sistema revertido
            economy[userId] = newBalance;
            saveJsonSafe(ECONOMY_PATH, economy);

            const guild = message.guild;
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return i.reply({ content: '❌ Não consegui encontrar seu usuário no servidor.', flags: [MessageFlags.Ephemeral] });
            }

            const role = guild.roles.cache.get(vip.id);
            if (!role) {
                return i.reply({ content: '❌ O cargo VIP configurado não foi encontrado.', flags: [MessageFlags.Ephemeral] });
            }

            await member.roles.add(role).catch(err => {
                console.error("Erro ao adicionar cargo VIP:", err);
                return i.reply({ content: '❌ Ocorreu um erro e não consegui adicionar seu cargo VIP.', flags: [MessageFlags.Ephemeral] });
            });

            // Lógica de salvar vips.json (mantida)
            let vips = loadJsonSafe(VIPS_PATH, []);
            if (!Array.isArray(vips)) {
                vips = [];
            }
            const now = Date.now();
            const monthMs = 30 * 24 * 60 * 60 * 1000;
            const existingIndex = vips.findIndex(e => e.userId === userId && e.guildId === guild.id && e.roleId === vip.id);
            let expiresAt;
            if (existingIndex !== -1) {
                const existing = vips[existingIndex];
                const base = Math.max(existing.expiresAt || 0, now);
                expiresAt = base + monthMs;
                vips[existingIndex].expiresAt = expiresAt;
            } else {
                expiresAt = now + monthMs;
                vips.push({ userId, guildId: guild.id, roleId: vip.id, expiresAt });
            }
            saveJsonSafe(VIPS_PATH, vips);

            sendLog(client, "vip", { userId, vipName: vip.name });

            const expiresDate = new Date(expiresAt).toLocaleString('pt-BR');
            i.reply({ content: `✅ Parabéns! Você comprou **${vip.name}** por **${vip.price.toLocaleString('pt-BR')} moedas**.\n💰 Saldo restante: **${newBalance.toLocaleString('pt-BR')}**.\n⏳ VIP expira em: **${expiresDate}**.`, flags: [MessageFlags.Ephemeral] });
        });

        collector.on('end', () => {
            msg.edit({ components: [] }).catch(() => {});
        });
    },
};