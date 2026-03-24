const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { sendLog } = require('../../logger');
const { loadEconomy, saveEconomy, addBalance, getBalance } = require('../../utils/economyManager');
const { isAllowedStaff } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoins')
        .setDescription('Adiciona moedas a um usuario (staff).')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario alvo.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade').setDescription('Moedas para adicionar.').setRequired(true).setMinValue(1))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    name: 'addcoins',
    description: 'Adiciona moedas a um usuario (staff).',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amountToAdd = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1], 10);
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        if (!isAllowedStaff(author.id)) {
            return reply({ content: 'Voce nao tem permissao para usar este comando.', ephemeral: isSlash });
        }
        if (!target) return reply('Informe um usuario valido.');
        if (isNaN(amountToAdd) || amountToAdd <= 0) return reply('Informe um valor valido e positivo.');

        const economy = loadEconomy();
        const newBalance = addBalance(economy, target.id, amountToAdd);
        saveEconomy(economy, client);

        await sendLog(client, 'economy', {
            userId: target.id,
            action: `Moedas adicionadas por ${author.tag}`,
            amount: amountToAdd,
            newBalance
        });

        const fmt = n => n.toLocaleString('pt-BR');
        return reply(`Adicionadas **${fmt(amountToAdd)}** moedas para ${target.user.tag}. Saldo atual: **${fmt(getBalance(economy, target.id))}**.`);
    },
};
