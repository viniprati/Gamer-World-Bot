// utils/vipManager.js
const fs = require('fs');
const path = require('path');

const VIPS_PATH = path.join(__dirname, '../vips.json');

function loadVips() {
    try {
        if (!fs.existsSync(VIPS_PATH)) {
            fs.writeFileSync(VIPS_PATH, JSON.stringify([], null, 2));
            return [];
        }
        const raw = fs.readFileSync(VIPS_PATH, 'utf8');
        return raw ? JSON.parse(raw) : [];
    } catch (err) {
        console.error('Erro ao ler vips.json', err);
        return [];
    }
}
function saveVips(arr) {
    try {
        fs.writeFileSync(VIPS_PATH, JSON.stringify(arr, null, 2));
    } catch (err) {
        console.error('Erro ao salvar vips.json', err);
    }
}

/**
 * startVipMonitor(client, intervalMs)
 * - client: seu Client do discord.js
 * - intervalMs: intervalo em ms para checar expirados (padrão 1h)
 */
function startVipMonitor(client, intervalMs = 60 * 60 * 1000) {
    if (!client) throw new Error('client é necessário para iniciar o monitor de VIPs.');

    async function checkExpired() {
        try {
            let vips = loadVips();
            const now = Date.now();
            let changed = false;

            // iterar com for..of e construir novo array de válidos
            const remaining = [];
            for (const entry of vips) {
                if (!entry || !entry.userId || !entry.roleId || !entry.guildId || !entry.expiresAt) continue;

                if (entry.expiresAt > now) {
                    remaining.push(entry);
                    continue;
                }

                // expirou -> remove role no guild
                try {
                    // tenta pegar guild do cache, senão fetch
                    let guild = client.guilds.cache.get(entry.guildId);
                    if (!guild) {
                        try { guild = await client.guilds.fetch(entry.guildId); } catch (e) { guild = null; }
                    }
                    if (!guild) {
                        // não encontrou guild — apenas não tenta remover, mas não mantém o registro
                        console.warn(`VIP expired: guild ${entry.guildId} not found. Removing record.`);
                        changed = true;
                        continue;
                    }

                    // tenta buscar membro
                    let member;
                    try { member = await guild.members.fetch(entry.userId); } catch (e) { member = null; }

                    if (member) {
                        if (member.roles.cache.has(entry.roleId)) {
                            try {
                                await member.roles.remove(entry.roleId, 'VIP expirado');
                                console.log(`Removido VIP role ${entry.roleId} de ${entry.userId} no servidor ${entry.guildId}`);
                            } catch (err) {
                                console.error(`Falha ao remover role ${entry.roleId} de ${entry.userId}:`, err);
                            }
                        }
                    } else {
                        console.warn(`Membro ${entry.userId} não encontrado no servidor ${entry.guildId}`);
                    }
                } catch (err) {
                    console.error('Erro ao processar VIP expirado:', err);
                    // se algo falhar, evita excluir o registro para tentar depois
                    remaining.push(entry);
                    continue;
                }

                changed = true; // registro removido
            }

            if (changed) saveVips(remaining);
        } catch (err) {
            console.error('Erro no checkExpired do VIP monitor:', err);
        }
    }

    // roda uma vez imediatamente e depois em interval
    checkExpired();
    const handle = setInterval(checkExpired, intervalMs);

    // retorna função para parar o monitor, se necessário
    return () => clearInterval(handle);
}

module.exports = { startVipMonitor };
