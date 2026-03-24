const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { sendLog } = require('../../logger');
const { loadEconomy, saveEconomy, getBalance, setBalance } = require('../../utils/economyManager');
const { isAllowedStaff } = require('../../utils/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removecoins')
        .setDescription('Remove moedas de um usuario (staff).')
        .addUserOption(option =>
            option.setName('usuario').setDescription('Usuario alvo.').setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantidade').setDescription('Moedas para remover.').setRequired(true).setMinValue(1))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    name: 'removecoins',
    description: 'Remove moedas de um usuario (staff).',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const target = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const amountToRemove = isSlash ? interactionOrMessage.options.getInteger('quantidade') : parseInt(args[1], 10);
        const reply = options => isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);

        if (!isAllowedStaff(author.id)) {
            return reply({ content: 'Voce nao tem permissao para usar este comando.', ephemeral: isSlash });
        }
        if (!target) return reply('Informe um usuario valido.');
        if (isNaN(amountToRemove) || amountToRemove <= 0) return reply('Informe um valor valido e positivo.');

        const economy = loadEconomy();
        const currentBalance = getBalance(economy, target.id);
        const newBalance = Math.max(0, currentBalance - amountToRemove);
        const amountActuallyRemoved = currentBalance - newBalance;
        setBalance(economy, target.id, newBalance);
        saveEconomy(economy, client);

        await sendLog(client, 'economy', {
            userId: target.id,
            action: `Moedas removidas por ${author.tag}`,
            amount: amountActuallyRemoved,
            newBalance
        });

        const fmt = n => n.toLocaleString('pt-BR');
        return reply(`Removidas **${fmt(amountActuallyRemoved)}** moedas de ${target.user.tag}. Saldo atual: **${fmt(newBalance)}**.`);
    },
};
