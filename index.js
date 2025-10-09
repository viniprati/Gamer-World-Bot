const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, prefix } = require('./config.json');
const { sendLog } = require('./logger');
const { startVipMonitor } = require('./utils/vipManager');
const { checkAndBackup } = require('./utils/backupManager');
const { startTempRoleMonitor } = require('./utils/tempRoleManager.js');
const { startLiveLeaderboard, scheduleDailyWinner } = require('./utils/dailyTopManager.js');
const { startReminderMonitor } = require('./utils/reminderManager.js');
const ms = require('ms');

// ===== Criar client =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
});

// ===== Coleções e Carregamento de Comandos (MODIFICADO) =====
client.commands = new Collection();
client.cooldowns = new Collection();
const economyCooldowns = new Collection();

console.log('[Carregador] Iniciando o carregamento de comandos...');
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
    const folderPath = path.join(__dirname, 'commands', folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            try {
                const command = require(path.join(folderPath, file));
                command.category = folder; // ADICIONADO: Salva a categoria no comando
                const commandName = command.data?.name || command.name;
                if (commandName) {
                    client.commands.set(commandName, command);
                } else {
                    console.warn(`[Carregador] ⚠️ O arquivo ${file} não é um comando válido e foi ignorado.`);
                }
            } catch (error) {
                console.error(`[Carregador] ❌ Falha ao carregar o comando no arquivo '${file}':`, error);
            }
        }
    }
}
console.log('[Carregador] Carregamento de comandos finalizado.');


// ===== Arquivos de Dados =====
const economyFile = path.join(__dirname, 'economy.json');
const usageFile = path.join(__dirname, 'command_usage.json');
const remindersFile = path.join(__dirname, 'rep_reminders.json');

if (!fs.existsSync(economyFile)) {
    fs.writeFileSync(economyFile, JSON.stringify({}, null, 2));
}
client.economy = {
    loadEconomy: () => {
        try {
            const rawData = fs.readFileSync(economyFile, 'utf8');
            return rawData ? JSON.parse(rawData) : {};
        } catch (e) {
            console.error("ERRO AO LER economy.json. Retornando objeto vazio.", e);
            return {};
        }
    },
    saveEconomy: (data) => {
        fs.writeFileSync(economyFile, JSON.stringify(data, null, 2));
        checkAndBackup(client, economyFile);
    },
};

// ===== Funções do Sistema de Lembrete de +Rep (COM DIAGNÓSTICO) =====
function loadReminders() {
    if (!fs.existsSync(remindersFile)) return [];
    try {
        const rawData = fs.readFileSync(remindersFile, 'utf8');
        const parsedData = rawData ? JSON.parse(rawData) : [];
        if (Array.isArray(parsedData)) {
            return parsedData;
        }
        console.warn("[Lembrete] rep_reminders.json não continha um array. Resetando.");
        return [];
    } catch {
        return [];
    }
}
function saveReminders(reminders) {
    fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
}
function startRepReminder(client) {
    console.log('✅ Sistema de lembretes de +rep iniciado. Verificando a cada minuto...');
    
    setInterval(async () => {
        console.log(`\n[Lembrete Debug] Verificando lembretes em: ${new Date().toLocaleString('pt-BR')}`);
        
        let reminders = loadReminders();
        const now = Date.now();
        
        console.log(`[Lembrete Debug] Lidos ${reminders.length} lembretes do arquivo.`);
        if (reminders.length > 0) {
            console.log(`[Lembrete Debug] Próximo lembrete agendado para: ${new Date(reminders[0].remindAt).toLocaleString('pt-BR')}`);
            console.log(`[Lembrete Debug] Horário atual (timestamp): ${now}`);
            console.log(`[Lembrete Debug] Próximo lembrete (timestamp): ${reminders[0].remindAt}`);
        }

        const dueReminders = reminders.filter(r => r.remindAt <= now);
        console.log(`[Lembrete Debug] Encontrados ${dueReminders.length} lembretes vencidos.`);

        if (dueReminders.length > 0) {
            try {
                const { REMINDER_CHANNEL_ID } = require('./config.json');
                if (!REMINDER_CHANNEL_ID) return console.log("[Lembrete Debug] ❌ ERRO: REMINDER_CHANNEL_ID não configurado.");

                console.log(`[Lembrete Debug] Tentando buscar o canal: ${REMINDER_CHANNEL_ID}`);
                const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
                
                if (channel) {
                    console.log(`[Lembrete Debug] ✅ Canal #${channel.name} encontrado. Enviando lembretes...`);
                    for (const reminder of dueReminders) {
                        const reminderEmbed = new EmbedBuilder()
                            .setColor('#3498DB')
                            .setAuthor({ name: 'Lembrete de Cooldown!', iconURL: client.user.displayAvatarURL() })
                            .setDescription(`Ei, <@${reminder.userId}>! Já se passou 1 hora. Você já pode usar o comando \`+rep\` novamente!`)
                            .setFooter({ text: 'Use o comando para fortalecer a comunidade.' })
                            .setTimestamp();
                        await channel.send({ content: `<@${reminder.userId}>`, embeds: [reminderEmbed] });
                        console.log(`[Lembrete Debug] ✅ Lembrete enviado para o usuário ID: ${reminder.userId}`);
                    }
                } else {
                    console.log(`[Lembrete Debug] ❌ ERRO: Canal com ID ${REMINDER_CHANNEL_ID} não encontrado.`);
                }
            } catch (error) {
                console.error(`[Lembrete Debug] ❌ ERRO CRÍTICO ao enviar lembretes:`, error);
            }
            
            const remainingReminders = reminders.filter(r => r.remindAt > now);
            console.log(`[Lembrete Debug] Salvando ${remainingReminders.length} lembretes restantes no arquivo.`);
            saveReminders(remainingReminders);
        }
        console.log(`--- [Lembrete Debug] Verificação concluída ---`);
    }, ms('1m')); 
}

// ===== Evento de Bot Pronto =====
client.once('clientReady', () => {
    console.log(`🤖 Gamer World Bot online como ${client.user.tag}`);
    try {
         syncExistingCooldowns();
        startVipMonitor(client);
        startRepReminder(client);
        startTempRoleMonitor(client);
        startLiveLeaderboard(client);
        scheduleDailyWinner(client);
        startReminderMonitor(client);
    } catch (error) {
        console.error('❌ Falha ao iniciar monitores:', error);
    }
});


// ===== Evento de Mensagem (PARA COMANDOS DE PREFIXO) =====
client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if (!command) return;

        // Lógica de Cooldown Antiraid
        if (!client.cooldowns.has(command.name)) client.cooldowns.set(command.name, new Collection());
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⏳ Por favor, aguarde **${timeLeft.toFixed(1)}s** para usar este comando novamente.`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            }
        }
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // RASTREAMENTO DE USO DE COMANDOS
        try {
            const userId = message.author.id;
            
            // Top Mensal
            let usageData = fs.existsSync(usageFile) ? JSON.parse(fs.readFileSync(usageFile, 'utf8')) : {};
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (!usageData[userId] || usageData[userId].lastMonth !== currentMonth) {
                usageData[userId] = { monthlyCount: 1, lastMonth: currentMonth };
            } else {
                usageData[userId].monthlyCount += 1;
            }
            fs.writeFileSync(usageFile, JSON.stringify(usageData, null, 2));

            // Top Diário
            const commandsToIgnore = ['addcoins', 'removecoins'];
            if (command.category === 'economia' && !commandsToIgnore.includes(command.name)) {
                const dailyTopPath = path.join(__dirname, 'daily_top.json');
                let dailyData = fs.existsSync(dailyTopPath) ? JSON.parse(fs.readFileSync(dailyTopPath, 'utf8')) : {};
                const today = new Date().toISOString().slice(0, 10);
                if (!dailyData[today]) dailyData[today] = {};
                if (!dailyData[today][userId]) dailyData[today][userId] = 0;
                dailyData[today][userId]++;
                fs.writeFileSync(dailyTopPath, JSON.stringify(dailyData, null, 2));
            }
        } catch (error) {
            console.error("Erro ao rastrear uso de comando:", error);
        }

        // Execução do Comando
        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(`Erro no comando '${commandName}':`, error);
            message.reply('❌ Ops! Ocorreu um erro inesperado.');
            sendLog(client, 'error', { commandName, error, guildName: message.guild.name, guildId: message.guild.id });
        }
    } else {
        // --- Se NÃO for um comando, processa o detector de +rep e o ganho de moedas ---
        
        // DETECTOR DE RESPOSTA DA LORITTA
        if (message.author.id === '297153970613387264') {
            const successMessage = "deu uma reputação para";
            if (message.content.includes(successMessage)) {
                const match = message.content.match(/<@(\d+)>/);
                if (match && match[1]) {
                    const userId = match[1];
                    let reminders = loadReminders();
                    reminders = reminders.filter(r => r.userId !== userId);
                    reminders.push({ userId: userId, remindAt: Date.now() + ms('1h') });
                    saveReminders(reminders);
                    console.log(`[Lembrete +rep] Lembrete agendado para o usuário com ID: ${userId}`);
                    try { await message.react('⏰'); } catch {}
                }
            }
        }
        
        // GANHO DE MOEDAS POR MENSAGEM (apenas para usuários)
        if (!message.author.bot) {
            if (!economyCooldowns.has(message.author.id)) {
                economyCooldowns.set(message.author.id, Date.now());
                setTimeout(() => economyCooldowns.delete(message.author.id), 3000);
                
                let data = client.economy.loadEconomy();
                const userId = message.author.id;
                const userData = data[userId];
                const currentBalance = userData?.balance || userData || 0;
                const amount = Math.floor(Math.random() * 5) + 1;
                data[userId] = currentBalance + amount;
                client.economy.saveEconomy(data);
            }
        }
    }
});

// ===== Evento para SLASH COMMANDS =====
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // RASTREAMENTO DE USO DE COMANDOS
    try {
        const userId = interaction.user.id;
        
        // Top Mensal
        let usageData = fs.existsSync(usageFile) ? JSON.parse(fs.readFileSync(usageFile, 'utf8')) : {};
        const currentMonth = new Date().toISOString().slice(0, 7);
        if (!usageData[userId] || usageData[userId].lastMonth !== currentMonth) {
            usageData[userId] = { monthlyCount: 1, lastMonth: currentMonth };
        } else {
            usageData[userId].monthlyCount += 1;
        }
        fs.writeFileSync(usageFile, JSON.stringify(usageData, null, 2));
        
        // Top Diário
        const commandsToIgnore = ['addcoins', 'removecoins'];
        if (command.category === 'economia' && !commandsToIgnore.includes(command.name)) {
            const dailyTopPath = path.join(__dirname, 'daily_top.json');
            let dailyData = fs.existsSync(dailyTopPath) ? JSON.parse(fs.readFileSync(dailyTopPath, 'utf8')) : {};
            const today = new Date().toISOString().slice(0, 10);
            if (!dailyData[today]) dailyData[today] = {};
            if (!dailyData[today][userId]) dailyData[today][userId] = 0;
            dailyData[today][userId]++;
            fs.writeFileSync(dailyTopPath, JSON.stringify(dailyData, null, 2));
        }
    } catch (error) {
        console.error("Erro ao rastrear uso de comando:", error);
    }
    
    // Execução do Comando
    try {
        await command.execute(client, interaction);
    } catch (error) {
        console.error(`Erro ao executar o slash command /${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Ops! Ocorreu um erro inesperado ao executar este comando.', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Ops! Ocorreu um erro inesperado ao executar este comando.', ephemeral: true });
        }
    }
});


// ===== Captura de Erros Globais =====
process.on('unhandledRejection', error => {
    console.error('ERRO GLOBAL (Unhandled Rejection):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Unhandled Rejection)' });
});

process.on('uncaughtException', error => {
    console.error('ERRO GLOBAL (Uncaught Exception):', error);
    if (client.isReady()) sendLog(client, 'error', { error, commandName: 'Processo Global (Uncaught Exception)' });
});


// ===== Login =====
client.login(token);