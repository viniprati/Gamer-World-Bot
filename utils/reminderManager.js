const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { REMINDER_CHANNEL_ID } = require('../config.json');

// ... (código anterior do reminderManager, funções load/save/schedule/check/start permanecem iguais) ...
const REMINDERS_PATH = path.join(__dirname, '..', 'cooldown_reminders.json');
const WORK_COOLDOWN_PATH = path.join(__dirname, '..', 'work_cooldowns.json');
const DAILY_TRANSACTIONS_PATH = path.join(__dirname, '..', 'transactions.json');
const PREMIUM_PATH = path.join(__dirname, '..', 'premium.json');

function loadJsonSafe(filePath, fallback = []) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}
function saveReminders(data) {
    fs.writeFileSync(REMINDERS_PATH, JSON.stringify(data, null, 2));
}
function scheduleReminder(userId, commandName, durationMs) { /* ... sem alteração ... */ }
async function checkAndSendReminders(client) { /* ... sem alteração ... */ }
function startReminderMonitor(client) { /* ... sem alteração ... */ }


// ===================================================================
// --- NOVA FUNÇÃO DE SINCRONIZAÇÃO COM DIAGNÓSTICO ---
// ===================================================================
function syncExistingCooldowns() {
    console.log('\n[SYNC-DIAGNÓSTICO] =======================================');
    console.log('[SYNC-DIAGNÓSTICO] 1. Iniciando sincronização de lembretes.');
    const now = Date.now();
    let syncedCount = 0;

    const workCooldowns = loadJsonSafe(WORK_COOLDOWN_PATH, {});
    const dailyTransactions = loadJsonSafe(DAILY_TRANSACTIONS_PATH, {});
    const premiumData = loadJsonSafe(PREMIUM_PATH, { users: [] });
    const existingReminders = loadJsonSafe(REMINDERS_PATH);

    console.log(`[SYNC-DIAGNÓSTICO] 2. Lidos ${Object.keys(workCooldowns).length} cooldowns de 'work'.`);
    console.log(`[SYNC-DIAGNÓSTICO] 3. Lidos ${Object.keys(dailyTransactions).length} usuários com transações de 'daily'.`);
    console.log(`[SYNC-DIAGNÓSTICO] 4. Lidos ${existingReminders.length} lembretes existentes.`);

    // 1. Sincronizar cooldowns do !work
    console.log('\n[SYNC-DIAGNÓSTICO] --- Verificando cooldowns de !work ---');
    for (const userId in workCooldowns) {
        const expiresAt = workCooldowns[userId];
        console.log(`[SYNC-DIAGNÓSTICO]   - Checando usuário ${userId}: cooldown expira em ${new Date(expiresAt).toLocaleTimeString('pt-BR')}`);
        
        if (expiresAt > now) {
            console.log(`[SYNC-DIAGNÓSTICO]     > Cooldown ATIVO.`);
            const alreadyExists = existingReminders.some(r => r.userId === userId && r.commandName === 'work');
            if (!alreadyExists) {
                console.log(`[SYNC-DIAGNÓSTICO]       >> Lembrete NÃO EXISTE. Adicionando.`);
                existingReminders.push({ userId, commandName: 'work', remindAt: expiresAt });
                syncedCount++;
            } else {
                console.log(`[SYNC-DIAGNÓSTICO]       >> Lembrete já existe. Ignorando.`);
            }
        } else {
             console.log(`[SYNC-DIAGNÓSTICO]     > Cooldown INATIVO/EXPIRADO.`);
        }
    }

    // 2. Sincronizar cooldowns do !daily
    console.log('\n[SYNC-DIAGNÓSTICO] --- Verificando cooldowns de !daily ---');
    for (const userId in dailyTransactions) {
        const userTransactions = dailyTransactions[userId];
        if (!Array.isArray(userTransactions)) continue;

        const lastDaily = userTransactions.filter(t => t.type === 'daily').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (lastDaily) {
            console.log(`[SYNC-DIAGNÓSTICO]   - Checando usuário ${userId}: último daily em ${new Date(lastDaily.date).toLocaleString('pt-BR')}`);
            const isPremium = premiumData.users.includes(userId);
            let cooldownDuration = 24 * 60 * 60 * 1000;
            if (isPremium) cooldownDuration *= 0.90;

            const expiresAt = new Date(lastDaily.date).getTime() + cooldownDuration;
            
            if (expiresAt > now) {
                console.log(`[SYNC-DIAGNÓSTICO]     > Cooldown ATIVO. Expira em ${new Date(expiresAt).toLocaleString('pt-BR')}`);
                const alreadyExists = existingReminders.some(r => r.userId === userId && r.commandName === 'daily');
                if (!alreadyExists) {
                    console.log(`[SYNC-DIAGNÓSTICO]       >> Lembrete NÃO EXISTE. Adicionando.`);
                    existingReminders.push({ userId, commandName: 'daily', remindAt: expiresAt });
                    syncedCount++;
                } else {
                    console.log(`[SYNC-DIAGNÓSTICO]       >> Lembrete já existe. Ignorando.`);
                }
            } else {
                console.log(`[SYNC-DIAGNÓSTICO]     > Cooldown INATIVO/EXPIRADO.`);
            }
        }
    }

    if (syncedCount > 0) {
        saveReminders(existingReminders);
        console.log(`\n[SYNC-DIAGNÓSTICO] 5. Sincronização concluída. ${syncedCount} novos lembretes foram salvos.`);
    } else {
        console.log('\n[SYNC-DIAGNÓSTICO] 5. Sincronização concluída. Nenhum novo lembrete foi adicionado.');
    }
    console.log('[SYNC-DIAGNÓSTICO] =======================================\n');
}

module.exports = { startReminderMonitor, scheduleReminder, syncExistingCooldowns };