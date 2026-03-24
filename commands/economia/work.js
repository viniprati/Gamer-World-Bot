const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');
const { scheduleReminder } = require('../../utils/reminderManager');
const { loadEconomy, saveEconomy, getBalance, setBalance } = require('../../utils/economyManager');

const COOLDOWN_PATH = path.join(__dirname, '..', '..', 'work_cooldowns.json');
const PREMIUM_PATH = path.join(__dirname, '..', '..', 'premium.json');

const workOptions = [
    { title: 'Streamer em Ascensao', message: 'Voce streamou e ganhou **{amount} moedas**!', color: '#6441A5' },
    { title: 'Cacador de Bugs', message: 'Voce encontrou uma falha e recebeu **{amount} moedas**.', color: '#E74C3C' },
    { title: 'Mestre do Farm', message: 'Voce farmou itens e vendeu por **{amount} moedas**.', color: '#F1C40F' },
    { title: 'Lenda da Speedrun', message: 'Sua speedrun rendeu **{amount} moedas** em doacoes.', color: '#3498DB' },
];

function loadJsonSafe(filePath, fallback = {}) {
    if (!fs.existsSync(filePath)) return fallback;
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function saveJsonSafe(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getPremiumUsers() {
    const data = loadJsonSafe(PREMIUM_PATH, { users: [] });
    return Array.isArray(data.users) ? data.users : [];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabalhe para ganhar moedas.'),

    name: 'work',
    aliases: ['trabalhar'],
    description: 'Trabalhe para ganhar moedas.',
    cooldown: 15,

    async execute(client, interactionOrMessage) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const user = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        const now = Date.now();
        const userId = user.id;
        const isPremium = getPremiumUsers().includes(userId);
        let cooldownDuration = 60 * 60 * 1000;
        if (isPremium) cooldownDuration *= 0.9;

        const cooldowns = loadJsonSafe(COOLDOWN_PATH, {});
        const lastWork = cooldowns[userId] || 0;
        const elapsed = now - lastWork;
        if (elapsed < cooldownDuration) {
            const next = `<t:${Math.floor((lastWork + cooldownDuration) / 1000)}:R>`;
            const embed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('Cooldown ativo')
                .setDescription(`Seu proximo trabalho estara disponivel ${next}.`);
            return reply({ embeds: [embed] });
        }

        let amountEarned = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
        if (isPremium) amountEarned *= 2;

        const economy = loadEconomy();
        const newBalance = getBalance(economy, userId) + amountEarned;
        setBalance(economy, userId, newBalance);
        saveEconomy(economy, client);

        cooldowns[userId] = now;
        saveJsonSafe(COOLDOWN_PATH, cooldowns);
        scheduleReminder(userId, 'work', cooldownDuration);

        await sendLog(client, 'economy', {
            userId,
            action: 'Comando work',
            amount: amountEarned,
            newBalance
        });

        const chosen = workOptions[Math.floor(Math.random() * workOptions.length)];
        const embed = new EmbedBuilder()
            .setColor(isPremium ? '#FFD700' : chosen.color)
            .setTitle(chosen.title)
            .setDescription(chosen.message.replace('{amount}', amountEarned.toLocaleString('pt-BR')))
            .addFields(
                { name: 'Recompensa', value: `+${amountEarned.toLocaleString('pt-BR')} moedas`, inline: true },
                { name: 'Saldo', value: newBalance.toLocaleString('pt-BR'), inline: true }
            );

        return reply({ embeds: [embed] });
    }
};
