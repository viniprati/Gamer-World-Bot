const { SlashCommandBuilder } = require('discord.js');
const { sendLog } = require('../../logger');
const { loadEconomy, saveEconomy, getBalance, setBalance } = require('../../utils/economyManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('give')
        .setDescription('Transfere moedas para outro usuario.')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario alvo.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade').setDescription('Quantidade de moedas.').setRequired(true).setMinValue(1)),

    name: 'give',
    description: 'Transfere moedas para outro usuario.',
    cooldown: 15,

    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amount = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1], 10);
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        if (!target) return reply('Informe um usuario valido para transferencia.');
        if (isNaN(amount) || amount <= 0) return reply('Informe um valor valido e positivo.');
        if (target.id === author.id) return reply('Voce nao pode transferir moedas para si mesmo.');
        if (target.user.bot) return reply('Voce nao pode transferir moedas para bots.');

        const economy = loadEconomy();
        const authorBalance = getBalance(economy, author.id);
        if (authorBalance < amount) {
            return reply('Saldo insuficiente para esta transferencia.');
        }

        const targetBalance = getBalance(economy, target.id);
        setBalance(economy, author.id, authorBalance - amount);
        setBalance(economy, target.id, targetBalance + amount);
        saveEconomy(economy, client);

        await sendLog(client, 'transaction', {
            fromId: author.id,
            toId: target.id,
            amount
        });

        const fmt = n => n.toLocaleString('pt-BR');
        return reply(`Transferencia realizada: **${fmt(amount)}** moedas para **${target.user.tag}**.`);
    },
};
