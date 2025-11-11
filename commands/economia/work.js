const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');

// Caminhos para os arquivos
const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
const COOLDOWN_PATH = path.join(__dirname, '..', '..', 'work_cooldowns.json');
const PREMIUM_PATH = path.join(__dirname, '..', '..', 'premium.json');

// Função do reminderManager
const { scheduleReminder } = require('../../utils/reminderManager.js');

// Função para ler usuários premium (sem alteração)
const getPremiumUsers = () => {
    try {
        if (!fs.existsSync(PREMIUM_PATH)) return { users: [] };
        const data = fs.readFileSync(PREMIUM_PATH, 'utf8');
        const parsed = JSON.parse(data);
        return (parsed && Array.isArray(parsed.users)) ? parsed : { users: [] };
    } catch (error) {
        console.error("Erro ao ler premium.json:", error);
        return { users: [] };
    }
};

// Lista de trabalhos (sem alteração)
const workOptions = [
    { title: 'Streamer em Ascensão', message: "Você passou a noite toda streamando na Twitch e ganhou **{amount} moedas** dos seus viewers!", color: '#6441A5' },
    { title: 'Caçador de Bugs', message: "Você encontrou uma falha na beta do novo JRPG e os desenvolvedores te pagaram **{amount} moedas** como recompensa.", color: '#E74C3C' },
    { title: 'Mestre do Farm', message: "Depois de horas farmando ouro em um MMO, você vendeu tudo e conseguiu **{amount} moedas**.", color: '#F1C40F' },
    { title: 'Lenda da Speedrun', message: "Sua speedrun de um jogo clássico foi um sucesso e você recebeu **{amount} moedas** em doações!", color: '#3498DB' },
    { title: 'Jornalista Gamer', message: "Você escreveu um guia completo para um chefe difícil e vendeu para uma revista de games por **{amount} moedas**.", color: '#95A5A6' },
    { title: 'Campeão de Torneio', message: "Você venceu o torneio local de Street Fighter e levou para casa o prêmio de **{amount} moedas**!", color: '#E67E22' },
    { title: 'Mercador da Comunidade', message: "Você vendeu um item cosmético super raro no mercado da comunidade e faturou **{amount} moedas**.", color: '#1ABC9C' }
];

// Funções de leitura/escrita de JSON (sem alteração)
function loadJsonSafe(filePath) {
    if (!fs.existsSync(filePath)) return {};
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error(`Erro ao ler ${filePath}:`, e);
        return {};
    }
}
function saveJsonSafe(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`Erro ao salvar ${filePath}:`, e);
    }
}

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Trabalhe para ganhar moedas.'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'work',
    aliases: ['trabalhar'],
    description: 'Trabalhe para ganhar moedas.',
    cooldown: 15,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const user = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        const userId = user.id; // Alterado para usar a variável unificada 'user'
        const now = Date.now();

        const premiumData = getPremiumUsers();
        const isPremium = premiumData.users.includes(userId);

        let cooldownDuration = 1 * 60 * 60 * 1000;
        if (isPremium) {
            cooldownDuration *= 0.90;
        }

        const cooldowns = loadJsonSafe(COOLDOWN_PATH);
        const lastWork = cooldowns[userId] || 0;
        const timePassed = now - lastWork;

        if (timePassed < cooldownDuration) {
            const nextWorkTimestamp = `<t:${Math.floor((lastWork + cooldownDuration) / 1000)}:R>`;
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('🔋 Energia Recarregando...')
                .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() }) // Alterado
                .setDescription(`Haja com calma, campeão! Suas energias precisam ser recarregadas antes do próximo turno.`)
                .addFields({ name: 'Disponível Novamente', value: `Seu próximo trabalho estará disponível ${nextWorkTimestamp}.` })
                .setTimestamp();
            return reply({ embeds: [cooldownEmbed] }); // Alterado
        }

        let amountEarned = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
        if (isPremium) {
            amountEarned *= 2;
        }

        const economy = loadJsonSafe(ECONOMY_PATH);
        const currentBalance = economy[userId] || 0;
        const newBalance = currentBalance + amountEarned;

        economy[userId] = newBalance;
        cooldowns[userId] = now;
        
        saveJsonSafe(ECONOMY_PATH, economy);
        saveJsonSafe(COOLDOWN_PATH, cooldowns);

        scheduleReminder(userId, 'work', cooldownDuration);


        await sendLog(client, "economy", {
            userId: userId,
            action: 'Trabalhou (Comando Work)',
            amount: amountEarned,
            newBalance: newBalance
        });

        const chosenWork = workOptions[Math.floor(Math.random() * workOptions.length)];
        const formattedMessage = chosenWork.message.replace('{amount}', `**${amountEarned.toLocaleString('pt-BR')}**`);

        const embed = new EmbedBuilder()
            .setColor(isPremium ? '#FFD700' : chosenWork.color)
            .setTitle(chosenWork.title)
            .setAuthor({ name: `Diário de Missão de ${user.username}`, iconURL: user.displayAvatarURL() }) 
            .setThumbnail(user.displayAvatarURL({ dynamic: true })) 
            .setDescription(formattedMessage)
            .addFields(
                { name: '✅ Recompensa', value: `+ **${amountEarned.toLocaleString('pt-BR')}** GameCoins`, inline: true },
                { name: '💰 Mochila', value: `**${newBalance.toLocaleString('pt-BR')}** GameCoins`, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: isPremium ? '✨ Bônus Premium Ativado!' : 'Missão concluída com sucesso!' });
            
        await reply({ embeds: [embed] });
    },
};