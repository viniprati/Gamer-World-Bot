const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { sendLog } = require('../../logger');
const { getConfig } = require('../../utils/config');

const premiumFilePath = path.join(__dirname, '..', '..', 'premium.json');
const ownerId = getConfig('OWNER_ID');

// Função para ler usuários premium (sem alteração)
const getPremiumUsers = () => {
    try {
        if (!fs.existsSync(premiumFilePath)) {
            fs.writeFileSync(premiumFilePath, JSON.stringify({ users: [] }, null, 2));
            return { users: [] };
        }
        const data = fs.readFileSync(premiumFilePath, 'utf8');
        if (!data) return { users: [] };
        const parsedData = JSON.parse(data);
        if (!parsedData || !Array.isArray(parsedData.users)) {
            console.warn('[Premium] premium.json está mal formatado. Retornando estrutura padrão.');
            return { users: [] };
        }
        return parsedData;
    } catch (error) {
        console.error("Erro crítico ao ler ou criar o arquivo premium.json:", error);
        return { users: [] };
    }
};

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('addpremium')
        .setDescription('Adiciona um usuário à lista de membros Premium (dono do bot).')
        .addUserOption(option =>
            option.setName('usuario')
                .setDescription('O usuário que receberá o status Premium.')
                .setRequired(true)),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'addpremium',
    description: 'Adiciona um usuário à lista de membros Premium (exclusivo para o dono do bot).',

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const author = isSlash ? interactionOrMessage.user : interactionOrMessage.author;
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // Verificação de permissão usando a variável unificada 'author'
        if (author.id !== ownerId) {
            if (isSlash) {
                return reply({ content: '❌ | Este comando é restrito ao dono do bot.', ephemeral: true });
            }
            return; // Para prefixo, simplesmente não responde
        }
        
        // Unifica a obtenção do usuário alvo
        let user;
        try {
            if (isSlash) {
                user = interactionOrMessage.options.getUser('usuario');
            } else {
                if (!args[0]) return reply('❌ | Sintaxe incorreta. Use: `!addpremium <@usuário ou ID>`');
                const mentionedUser = interactionOrMessage.mentions.users.first();
                user = mentionedUser ? mentionedUser : await client.users.fetch(args[0]);
            }
        } catch (error) {
            return reply('❌ | Não consegui encontrar este usuário. Verifique o ID fornecido.');
        }

        if (!user) {
             return reply('❌ | Não consegui encontrar este usuário.');
        }

        try {
            const premiumData = getPremiumUsers();

            if (premiumData.users.includes(user.id)) {
                return reply({ content: `🟡 | O usuário **${user.username}** já está na lista Premium.`, ephemeral: isSlash });
            }

            premiumData.users.push(user.id);
            fs.writeFileSync(premiumFilePath, JSON.stringify(premiumData, null, 2));

            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('✨ Status Premium Adicionado!')
                .setDescription(`O usuário **${user.username}** foi adicionado à base de dados Premium.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Status concedido por: ${author.username}` });

            await reply({ embeds: [embed] });

            sendLog(client, 'premium', { 
                action: 'Adicionado', 
                userTag: user.tag, 
                adminTag: author.tag 
            });

        } catch (error) {
            console.error(error);
            sendLog(client, 'error', {
                commandName: 'addpremium',
                error: error,
                guildName: isSlash ? interactionOrMessage.guild.name : interactionOrMessage.guild.name,
                guildId: isSlash ? interactionOrMessage.guild.id : interactionOrMessage.guild.id
            });
            await reply({ content: '❌ | Ocorreu um erro ao tentar modificar a base de dados Premium.', ephemeral: isSlash });
        }
    }
};
