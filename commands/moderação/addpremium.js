// CORREÇÃO 1: Importando 'EmbedBuilder' em vez de 'MessageEmbed'
const { EmbedBuilder } = require('discord.js'); 
const fs = require('fs');
const path = require('path');
const { ownerId } = require('../../config.json');
const { sendLog } = require('../../logger'); 

const premiumFilePath = path.join(__dirname, '..', '..', 'premium.json');

const getPremiumUsers = () => {
    try {
        if (!fs.existsSync(premiumFilePath)) {
            fs.writeFileSync(premiumFilePath, JSON.stringify({ users: [] }, null, 2));
            return { users: [] };
        }
        
        const data = fs.readFileSync(premiumFilePath, 'utf8');
        if (!data) {
            return { users: [] };
        }

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
    name: 'addpremium',
    description: 'Adiciona um usuário à lista de membros Premium (exclusivo para o dono do bot).',

    execute: async (client, message, args) => {
        if (message.author.id !== ownerId) {
            return;
        }

        if (!args[0]) {
            return message.reply('❌ | Sintaxe incorreta. Use: `!addpremium <@usuário ou ID>`');
        }

        let user;
        try {
            const mentionedUser = message.mentions.users.first();
            user = mentionedUser ? mentionedUser : await client.users.fetch(args[0]);
        } catch (error) {
            return message.reply('❌ | Não consegui encontrar este usuário. Verifique o ID fornecido.');
        }

        if (!user) {
             return message.reply('❌ | Não consegui encontrar este usuário.');
        }

        try {
            const premiumData = getPremiumUsers();

            if (premiumData.users.includes(user.id)) {
                return message.reply(`🟡 | O usuário **${user.username}** já está na lista Premium.`);
            }

            premiumData.users.push(user.id);
            fs.writeFileSync(premiumFilePath, JSON.stringify(premiumData, null, 2));

            // CORREÇÃO 2: Usando 'new EmbedBuilder()' em vez de 'new MessageEmbed()'
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('✨ Status Premium Adicionado!')
                .setDescription(`O usuário **${user.username}** foi adicionado à base de dados Premium.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Status concedido por: ${message.author.username}` });

            await message.channel.send({ embeds: [embed] });

            sendLog(client, 'premium', { 
                action: 'Adicionado', 
                userTag: user.tag, 
                adminTag: message.author.tag 
            });

        } catch (error) {
            console.error(error);
            sendLog(client, 'error', {
                commandName: 'addpremium',
                error: error,
                guildName: message.guild.name,
                guildId: message.guild.id
            });
            await message.reply('❌ | Ocorreu um erro ao tentar modificar a base de dados Premium.');
        }
    }
};