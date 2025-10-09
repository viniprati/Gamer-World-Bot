const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { REMINDER_CHANNEL_ID } = require('../config.json');

const REMINDERS_PATH = path.join(__dirname, '..', 'cooldown_reminders.json');

function loadReminders() {
    if (!fs.existsSync(REMINDERS_PATH)) {
        fs.writeFileSync(REMINDERS_PATH, '[]', 'utf8');
        return [];
    }
    try {
        const data = fs.readFileSync(REMINDERS_PATH, 'utf8');
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveReminders(data) {
    fs.writeFileSync(REMINDERS_PATH, JSON.stringify(data, null, 2));
}

function scheduleReminder(userId, commandName, durationMs) {
    const reminders = loadReminders();
    const remindAt = Date.now() + durationMs;

    reminders.push({
        userId,
        commandName,
        remindAt
    });

    saveReminders(reminders);
    console.log(`[ReminderManager] Lembrete para '${commandName}' agendado para o usuário ${userId}.`);
}

async function checkAndSendReminders(client) {
    let reminders = loadReminders();
    const now = Date.now();
    
    const dueReminders = reminders.filter(r => r.remindAt <= now);
    if (dueReminders.length === 0) return;

    console.log(`[ReminderManager] Encontrados ${dueReminders.length} lembretes para enviar.`);

    try {
        const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
        if (!channel) {
            console.error(`[ReminderManager] ERRO: Canal de lembretes com ID ${REMINDER_CHANNEL_ID} não foi encontrado.`);
            return;
        }

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
    setInterval(() => checkAndSendReminders(client), 30 * 1000); // Verifica a cada 30 segundos
}

module.exports = { startReminderMonitor, scheduleReminder };