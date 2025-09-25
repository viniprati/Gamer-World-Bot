const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger.js');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Transfere moedas para outro usuário.')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário para quem você quer enviar as moedas.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade')
                .setDescription('A quantidade de moedas a ser enviada.')
                .setRequired(true)
                .setMinValue(1)), // Garante que a quantidade seja sempre positiva

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'give',
    description: 'Transfere moedas para outro usuário.',
    cooldown: 15,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        
        // Unifica como obter quem enviou o comando
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        
        // Unifica como obter o alvo e a quantidade
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amount = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1], 10);
        
        // Unifica como enviar a resposta
        const reply = (options) => {
            // Para slash, a primeira resposta é sempre especial. As outras podem ser followUp.
            if (isSlash) {
                return interactionOrMessage.replied || interactionOrMessage.deferred 
                    ? interactionOrMessage.followUp(options) 
                    : interactionOrMessage.reply(options);
            }
            return interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // A partir daqui, o código usa as variáveis unificadas.
        
        // Validações
        if (!target) return reply('Mencione o usuário para transferir moedas. Ex: `!give @alguem 100`');
        if (isNaN(amount) || amount <= 0) return reply('Informe um valor válido e positivo.');
        if (target.id === author.id) return reply('Você não pode transferir moedas para si mesmo.');
        if (target.user.bot) return reply('Você não pode transferir moedas para um bot.');


        let economyData = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            economyData = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const authorId = author.id;
        const targetId = target.id;

        const authorBalance = economyData[authorId] || 0;

        if (authorBalance < amount) {
            return reply('Você não tem moedas suficientes para realizar esta transferência.');
        }

        const targetBalance = economyData[targetId] || 0;

        // Lógica de transferência
        economyData[authorId] = authorBalance - amount;
        economyData[targetId] = targetBalance + amount;
        
        fs.writeFileSync(ECONOMY_PATH, JSON.stringify(economyData, null, 2));

        // Envia o log da transação
        await sendLog(client, 'transaction', {
            fromId: authorId,
            toId: targetId,
            amount: amount
        });

        const fmt = (n) => n.toLocaleString('pt-BR');
        return reply(`✅ Você enviou 💰 **${fmt(amount)}** moedas para **${target.user.tag}**.`);
    },
};