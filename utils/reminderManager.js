const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');

const REMINDER_CHANNEL_ID = getConfig('REMINDER_CHANNEL_ID');

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

function scheduleReminder(userId, commandName, durationMs) {
    const reminders = loadJsonSafe(REMINDERS_PATH, []);
    const remindAt = Date.now() + durationMs;
    reminders.push({ userId, commandName, remindAt });
    saveReminders(reminders);
    console.log(`[ReminderManager] Lembrete para '${commandName}' agendado para ${userId}.`);
}

async function checkAndSendReminders(client) {
    let reminders = loadJsonSafe(REMINDERS_PATH, []);
    const now = Date.now();
    const dueReminders = reminders.filter(r => r.remindAt <= now);
    if (dueReminders.length === 0) return;

    console.log(`[ReminderManager] Encontrados ${dueReminders.length} lembretes para enviar.`);
    try {
        const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
        if (!channel) return console.error(`[ReminderManager] ERRO: Canal de lembretes ${REMINDER_CHANNEL_ID} não encontrado.`);
        for (const reminder of dueReminders) {
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('⏰ Cooldown Finalizado!')
                .setDescription(`Ei, <@${reminder.userId}>! Seu tempo de recarga para o comando \`!${reminder.commandName}\` acabou. Você já pode usá-lo novamente!`)
                .setTimestamp();
            await channel.send({ content: `<@${reminder.userId}>`, embeds: [embed] });
        }
    } catch (error) {
        console.error('[ReminderManager] Erro ao enviar lembretes:', error);
    }
    const remainingReminders = reminders.filter(r => r.remindAt > now);
    saveReminders(remainingReminders);
}

function startReminderMonitor(client) {
    console.log('✅ Monitor de Lembretes de Cooldown iniciado.');
    setInterval(() => checkAndSendReminders(client), 30 * 1000);
}

function syncExistingCooldowns() {
    console.log('[ReminderManager] Sincronizando lembretes para cooldowns existentes...');
    const now = Date.now();
    let syncedCount = 0;

    const workCooldowns = loadJsonSafe(WORK_COOLDOWN_PATH, {});
    const dailyTransactions = loadJsonSafe(DAILY_TRANSACTIONS_PATH, {});
    const premiumData = loadJsonSafe(PREMIUM_PATH, { users: [] });
    let existingReminders = loadJsonSafe(REMINDERS_PATH, []);

    // 1. Sincronizar cooldowns do !work
    for (const userId in workCooldowns) {
        const lastWorkTimestamp = workCooldowns[userId];
        if (!lastWorkTimestamp) continue;
        const isPremium = premiumData.users.includes(userId);
        let cooldownDuration = 1 * 60 * 60 * 1000;
        if (isPremium) cooldownDuration *= 0.90;
        const expiresAt = lastWorkTimestamp + cooldownDuration;
        if (expiresAt > now) {
            const alreadyExists = existingReminders.some(r => r.userId === userId && r.commandName === 'work');
            if (!alreadyExists) {
                existingReminders.push({ userId, commandName: 'work', remindAt: expiresAt });
                syncedCount++;
            }
        }
    }

    // 2. Sincronizar cooldowns do !daily
    for (const userId in dailyTransactions) {
        const userTransactions = dailyTransactions[userId];
        if (!Array.isArray(userTransactions)) continue;
        const lastDaily = userTransactions.filter(t => t.type === 'daily').sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (lastDaily) {
            const isPremium = premiumData.users.includes(userId);
            let cooldownDuration = 24 * 60 * 60 * 1000;
            if (isPremium) cooldownDuration *= 0.90;

            // --- CORREÇÃO APLICADA ---
            // A data no transactions.json é uma string ISO, precisamos convertê-la para um timestamp (número)
            const lastDailyTimestamp = new Date(lastDaily.date).getTime();
            const expiresAt = lastDailyTimestamp + cooldownDuration;
            // --- FIM DA CORREÇÃO ---

            if (expiresAt > now) {
                const alreadyExists = existingReminders.some(r => r.userId === userId && r.commandName === 'daily');
                if (!alreadyExists) {
                    existingReminders.push({ userId, commandName: 'daily', remindAt: expiresAt });
                    syncedCount++;
                }
            }
        }
    }

    if (syncedCount > 0) {
        saveReminders(existingReminders);
        console.log(`[ReminderManager] Sincronização concluída. ${syncedCount} novos lembretes foram salvos.`);
    } else {
        console.log('[ReminderManager] Sincronização concluída. Nenhum cooldown ativo pré-existente foi encontrado para sincronizar.');
    }
}

module.exports = { startReminderMonitor, scheduleReminder, syncExistingCooldowns };
