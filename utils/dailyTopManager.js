const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getConfig } = require('./config');
// A linha 'const cron = require('node-cron');' foi REMOVIDA.

const LEADERBOARD_CHANNEL_ID = getConfig('LEADERBOARD_CHANNEL_ID', '1423672870839652455');
const ANNOUNCEMENT_CHANNEL_ID = getConfig('ANNOUNCEMENT_CHANNEL_ID', '1423674699736416296');
const DAILY_TOP_PATH = path.join(__dirname, '..', 'daily_top.json');
const STATE_PATH = path.join(__dirname, '..', 'system_state.json');

// As funções de carregar/salvar estado e dados permanecem as mesmas
function loadState() {
    if (!fs.existsSync(STATE_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')); } catch { return {}; }
}
function saveState(data) {
    const currentState = loadState();
    const newState = { ...currentState, ...data };
    fs.writeFileSync(STATE_PATH, JSON.stringify(newState, null, 2));
}
function loadDailyTop() {
    if (!fs.existsSync(DAILY_TOP_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DAILY_TOP_PATH, 'utf8')); } catch { return {}; }
}

// A função do placar ao vivo permanece a mesma
async function startLiveLeaderboard(client) {
    console.log('✅ Placar ao vivo do Top Diário iniciado.');
    const channel = await client.channels.fetch(LEADERBOARD_CHANNEL_ID).catch(() => null);
    if (!channel) return console.error('[DailyTop] Canal do placar não encontrado.');

    let leaderboardMessage;
    const state = loadState();
    const messageId = state.dailyLeaderboardMessageId;

    if (messageId) {
        leaderboardMessage = await channel.messages.fetch(messageId).catch(() => null);
    }

    if (!leaderboardMessage) {
        console.log('[DailyTop] Mensagem do placar não encontrada. Limpando canal e criando uma nova...');
        const botMessages = await channel.messages.fetch({ limit: 50 });
        const oldLeaderboards = botMessages.filter(m => m.author.id === client.user.id);
        if (oldLeaderboards.size > 0) {
            await channel.bulkDelete(oldLeaderboards).catch(console.error);
        }

        const placeholderEmbed = new EmbedBuilder().setDescription("Iniciando o placar ao vivo...");
        leaderboardMessage = await channel.send({ embeds: [placeholderEmbed] });
        saveState({ dailyLeaderboardMessageId: leaderboardMessage.id });
    }

    setInterval(async () => {
        try {
            const dailyData = loadDailyTop();
            const today = new Date().toISOString().slice(0, 10);
            const todayStats = dailyData[today] || {};
            const sorted = Object.entries(todayStats).sort(([, a], [, b]) => b - a).slice(0, 10);

            const embed = new EmbedBuilder()
                .setColor('Gold')
                .setTitle('🏆 Top Atividade Diária (Comandos de Economia)')
                .setDescription('O placar é atualizado a cada 30 segundos. O grande vencedor será anunciado à meia-noite!')
                .setTimestamp();

            if (sorted.length === 0) {
                embed.addFields({ name: 'O ranking de hoje ainda está vazio...', value: 'Use comandos de economia para aparecer aqui!' });
            } else {
                const userPromises = sorted.map(([userId]) => client.users.fetch(userId).catch(() => ({ tag: 'Usuário Desconhecido' })));
                const users = await Promise.all(userPromises);
                const fields = users.map((user, index) => ({
                    name: `${index + 1}. ${user.tag}`,
                    value: `\`${sorted[index][1]}\` comandos`,
                    inline: false
                }));
                embed.addFields(fields);
            }

            await leaderboardMessage.edit({ embeds: [embed] });
        } catch (error) {
            console.error('[DailyTop] Erro ao atualizar o placar:', error);
        }
    }, 30 * 1000);
}


// ===================================================================
// --- NOVA FUNÇÃO DE AGENDAMENTO SEM BIBLIOTECA EXTERNA ---
// ===================================================================
function scheduleDailyWinner(client) {
    console.log('✅ Agendador do vencedor diário (via setInterval) iniciado.');

    // Guarda a data do dia em que o bot iniciou
    let lastCheckedDate = new Date().toISOString().slice(0, 10);

    // Verifica a cada minuto
    setInterval(async () => {
        const currentDate = new Date().toISOString().slice(0, 10);

        // Se a data atual for diferente da última data checada, significa que o dia virou!
        if (currentDate !== lastCheckedDate) {
            console.log(`[DailyTop] Detecção de novo dia! Anunciando o vencedor de ${lastCheckedDate}`);
            
            const yesterdayStats = loadDailyTop()[lastCheckedDate] || {};
            const sorted = Object.entries(yesterdayStats).sort(([, a], [, b]) => b - a);

            if (sorted.length > 0) {
                const winnerId = sorted[0][0];
                const winnerCount = sorted[0][1];
                try {
                    const winnerUser = await client.users.fetch(winnerId);
                    const channel = await client.channels.fetch(ANNOUNCEMENT_CHANNEL_ID);

                    const embed = new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('🎉 Vencedor do Top Diário!')
                        .setDescription(`Parabéns, **${winnerUser.tag}**! Você foi o membro mais ativo de ontem, usando \`${winnerCount}\` comandos de economia.`)
                        .setThumbnail(winnerUser.displayAvatarURL())
                        .setFooter({ text: `Continue assim para aparecer no ranking novamente!` })
                        .setTimestamp();
                    
                    await channel.send({ content: `🏆 Parabéns, <@${winnerId}>!`, embeds: [embed] });
                    console.log(`[DailyTop] Anunciado o vencedor: ${winnerUser.tag}`);
                } catch (error) {
                    console.error('[DailyTop] Erro ao anunciar o vencedor:', error);
                }
            } else {
                console.log('[DailyTop] Nenhum participante ontem para anunciar um vencedor.');
            }

            // Atualiza a data da última checagem para o novo dia
            lastCheckedDate = currentDate;
        }
    }, 60 * 1000); // Roda a cada 60 segundos
}

module.exports = { startLiveLeaderboard, scheduleDailyWinner };
