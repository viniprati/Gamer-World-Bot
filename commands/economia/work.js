const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../../logger');

// Define os caminhos para os arquivos
const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');
const COOLDOWN_PATH = path.join(__dirname, '..', '..', 'work_cooldowns.json');

const COOLDOWN_DURATION = 1 * 60 * 60 * 1000; // 1 hora em milissegundos

// ATUALIZADO: A lista agora contém objetos com título, mensagem e cor
const workOptions = [
    { title: 'Streamer em Ascensão', message: "Você passou a noite toda streamando na Twitch e ganhou **{amount} moedas** dos seus viewers!", color: '#6441A5' },
    { title: 'Caçador de Bugs', message: "Você encontrou uma falha na beta do novo JRPG e os desenvolvedores te pagaram **{amount} moedas** como recompensa.", color: '#E74C3C' },
    { title: 'Mestre do Farm', message: "Depois de horas farmando ouro em um MMO, você vendeu tudo e conseguiu **{amount} moedas**.", color: '#F1C40F' },
    { title: 'Lenda da Speedrun', message: "Sua speedrun de um jogo clássico foi um sucesso e você recebeu **{amount} moedas** em doações!", color: '#3498DB' },
    { title: 'Jornalista Gamer', message: "Você escreveu um guia completo para um chefe difícil e vendeu para uma revista de games por **{amount} moedas**.", color: '#95A5A6' },
    { title: 'Campeão de Torneio', message: "Você venceu o torneio local de Street Fighter e levou para casa o prêmio de **{amount} moedas**!", color: '#E67E22' },
    { title: 'Mercador da Comunidade', message: "Você vendeu um item cosmético super raro no mercado da comunidade e faturou **{amount} moedas**.", color: '#1ABC9C' }
];

// Funções de leitura/escrita de JSON (sem alterações)
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
    name: 'work',
    aliases: ['trabalhar'],
    description: 'Trabalhe para ganhar moedas (cooldown de 1 hora).',
    cooldown: 15, // Cooldown anti-spam
    async execute(message, args, client) {
        const userId = message.author.id;
        const now = Date.now();

        const cooldowns = loadJsonSafe(COOLDOWN_PATH);
        const lastWork = cooldowns[userId] || 0;
        const timePassed = now - lastWork;

        if (timePassed < COOLDOWN_DURATION) {
            const timeLeft = COOLDOWN_DURATION - timePassed;
            const nextWorkTimestamp = `<t:${Math.floor((lastWork + COOLDOWN_DURATION) / 1000)}:R>`;

            // ATUALIZADO: A resposta de cooldown agora é um embed
            const cooldownEmbed = new EmbedBuilder()
                .setColor('#E67E22')
                .setTitle('Hora de Descansar, Gamer!')
                .setDescription(`Você já completou seu turno. É preciso recarregar as energias!`)
                .addFields({ name: 'Próximo Turno Disponível', value: `Você poderá trabalhar novamente ${nextWorkTimestamp}.` })
                .setTimestamp();
            
            return message.reply({ embeds: [cooldownEmbed] });
        }

        const economy = loadJsonSafe(ECONOMY_PATH);
        const amountEarned = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
        
        const currentBalance = economy[userId] || 0;
        const newBalance = currentBalance + amountEarned;

        economy[userId] = newBalance;
        cooldowns[userId] = now;
        
        saveJsonSafe(ECONOMY_PATH, economy);
        saveJsonSafe(COOLDOWN_PATH, cooldowns);

        await sendLog(client, "economy", {
            userId: userId,
            action: 'Trabalhou (Comando Work)',
            amount: amountEarned,
            newBalance: newBalance
        });

        const chosenWork = workOptions[Math.floor(Math.random() * workOptions.length)];
        const formattedMessage = chosenWork.message.replace('{amount}', `**${amountEarned.toLocaleString('pt-BR')}**`);

        // ATUALIZADO: O embed de sucesso está mais bonito e organizado
        const embed = new EmbedBuilder()
            .setColor(chosenWork.color)
            .setAuthor({ name: `Relatório de Trabalho de ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTitle(chosenWork.title)
            .setDescription(formattedMessage)
            .addFields(
                { name: '✅ Ganhos', value: `+ ${amountEarned.toLocaleString('pt-BR')} moedas`, inline: true },
                { name: '💰 Saldo Final', value: `${newBalance.toLocaleString('pt-BR')} moedas`, inline: true }
            )
            .setTimestamp();
            
        message.reply({ embeds: [embed] });
    },
};