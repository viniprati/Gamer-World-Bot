const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const ECONOMY_PATH = path.join(__dirname, '..', '..', 'economy.json');

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Mostra o saldo de moedas de um usuário e sua posição no ranking.')
        .addUserOption(option => 
            option.setName('usuario')
                .setDescription('O usuário que você quer ver o saldo (opcional).')
                .setRequired(false)),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'balance',
    aliases: ['bal', 'atm', 'carteira', 'ba'],
    description: 'Mostra o saldo de moedas de um usuário e sua posição no ranking.',
    cooldown: 5,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração para unificar os sistemas ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();

        // Unifica como obter o alvo (target)
        const target = isSlash
            ? (interactionOrMessage.options.getMember('usuario') || interactionOrMessage.member)
            : (interactionOrMessage.mentions.members.first() || interactionOrMessage.member);
        
        // Unifica como enviar a resposta
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // A partir daqui, o resto do seu código funciona perfeitamente sem alterações,
        // pois ele usará as variáveis unificadas 'target' e 'reply'.

        let data = {};
        if (fs.existsSync(ECONOMY_PATH)) {
            data = JSON.parse(fs.readFileSync(ECONOMY_PATH, 'utf8'));
        }

        const userData = data[target.id];
        const balance = userData?.balance || userData || 0;

        const ranking = Object.entries(data)
            .sort(([, a], [, b]) => (b?.balance || b || 0) - (a?.balance || a || 0))
            .map(([id]) => id);

        const position = ranking.indexOf(target.id) + 1;

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setAuthor({ name: `Carteira de ${target.user.username}`, iconURL: target.user.displayAvatarURL() })
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Moedas', value: `🎮 ${balance.toLocaleString('pt-BR')}`, inline: true },
                { name: 'Ranking', value: `🏆 ${position > 0 ? `${position}º lugar` : 'Não ranqueado'}`, inline: true }
            )
            .setFooter({ text: 'Gamer World Economia', iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Usa a função de resposta unificada
        await reply({ embeds: [embed] });
    },
};