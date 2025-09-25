const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('removecoins')
        .setDescription('Remove moedas de um usuário (somente staff).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário de quem remover as moedas.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('A quantidade de moedas a ser removida.')
                .setRequired(true)
                .setMinValue(1)),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'removecoins',
    description: 'Remove moedas de um usuário (somente pessoas autorizadas).',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amountToRemove = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1]);
        
        const reply = (options) => {
            if (isSlash) {
                return interactionOrMessage.reply(options);
            }
            return interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // A lógica de permissão agora usa a variável unificada 'author'
        const allowedUsers = ['1077723832036630528', '983870132063453235', '820041555443449856', '1109255544495145021'];
        if (!allowedUsers.includes(author.id)) {
            // Para slash commands, a resposta de erro pode ser efêmera (só o usuário vê)
            return reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: isSlash });
        }

        // As validações agora usam as variáveis unificadas 'target' e 'amountToRemove'
        if (!target) return reply('Mencione o usuário ou selecione a opção para remover moedas.');
        if (isNaN(amountToRemove) || amountToRemove <= 0) return reply('Digite um valor válido e positivo.');

        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const targetId = target.id;
        const userData = economyData[targetId];

        const currentBalance = userData?.balance || userData || 0;
        const newBalance = Math.max(0, currentBalance - amountToRemove);
        const amountActuallyRemoved = currentBalance - newBalance;

        economyData[targetId] = newBalance;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        // O log agora usa a variável unificada 'author'
        await sendLog(client, "economy", { 
            userId: targetId, 
            action: `Moedas removidas por Staff (${author.tag})`,
            amount: amountActuallyRemoved, 
            newBalance: newBalance
        });

        const fmt = (n) => n.toLocaleString('pt-BR');
        // A resposta final usa a função unificada 'reply'
        await reply(`✅ Removidas **${fmt(amountActuallyRemoved)} moedas** de ${target.user.tag}. Agora ele tem **${fmt(newBalance)} moedas**.`);
    },
};