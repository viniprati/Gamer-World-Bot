const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('addcoins')
        .setDescription('Adiciona moedas a um usuário (somente staff).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário que receberá as moedas.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('A quantidade de moedas a ser adicionada.')
                .setRequired(true)
                .setMinValue(1)),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'addcoins',
    description: 'Adiciona moedas a um usuário (somente pessoas autorizadas).',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amountToAdd = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1]);
        
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // Lógica de permissão (coloque os IDs da sua staff aqui)
        const allowedUsers = ['1077723832036630528', '983870132063453235', '820041555443449856', '1109255544495145021'];
        if (!allowedUsers.includes(author.id)) {
            return reply({ content: '❌ Você não tem permissão para usar este comando.', ephemeral: isSlash });
        }

        // Validações
        if (!target) return reply('Mencione o usuário ou selecione a opção para adicionar moedas.');
        if (isNaN(amountToAdd) || amountToAdd <= 0) return reply('Digite um valor válido e positivo.');

        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const targetId = target.id;
        const userData = economyData[targetId];

        const currentBalance = userData?.balance || userData || 0;
        const newBalance = currentBalance + amountToAdd;

        economyData[targetId] = newBalance;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        await sendLog(client, "economy", { 
            userId: targetId, 
            action: `Moedas adicionadas por Staff (${author.tag})`,
            amount: amountToAdd, 
            newBalance: newBalance
        });

        const fmt = (n) => n.toLocaleString('pt-BR');
        await reply(`✅ Adicionadas **${fmt(amountToAdd)} moedas** para ${target.user.tag}. Agora ele tem **${fmt(newBalance)} moedas**.`);
    },
};