const { MessageEmbed } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ownerId } = require('../../config.json');
const logger = require('../../logger');

// Define o caminho absoluto para o premium.json na raiz do projeto, garantindo que funcione sempre
const premiumFilePath = path.join(__dirname, '..', '..', 'premium.json');

/**
 * Lê o arquivo premium.json de forma segura.
 * Se o arquivo não existir, ele será criado com uma estrutura padrão.
 * @returns {{users: string[]}} O objeto com a lista de IDs de usuários premium.
 */
const getPremiumUsers = () => {
    try {
        // Verifica se o arquivo existe antes de tentar ler
        if (!fs.existsSync(premiumFilePath)) {
            // Se não existir, cria o arquivo com um array de usuários vazio
            fs.writeFileSync(premiumFilePath, JSON.stringify({ users: [] }, null, 2));
            return { users: [] };
        }
        // Se existir, lê o arquivo
        const data = fs.readFileSync(premiumFilePath, 'utf8');
        // Converte o conteúdo para JSON e retorna
        return JSON.parse(data);
    } catch (error) {
        console.error("Erro crítico ao ler ou criar o arquivo premium.json:", error);
        // Em caso de qualquer erro (ex: JSON corrompido), retorna um objeto vazio para evitar crash
        return { users: [] };
    }
};

module.exports = {
    name: 'addpremium',
    description: 'Adiciona um usuário à lista de membros Premium (exclusivo para o dono do bot).',
    options: [
        {
            name: 'usuario',
            type: 'USER',
            description: 'O usuário que receberá o status Premium.',
            required: true,
        },
    ],

    // ================== INÍCIO DAS ALTERAÇÕES ==================
    // Alterado para receber 'message' e 'args' em vez de 'interaction'.
    execute: async (client, message, args) => {
        // --- 1. Verificação de Permissão ---
        // Alterado de 'interaction.user.id' para 'message.author.id'
        if (message.author.id !== ownerId) {
            // Prefix commands não têm respostas efêmeras, então simplesmente retornamos.
            return;
        }

        // --- Lógica para encontrar o usuário a partir da mensagem ---
        if (!args[0]) {
            return message.reply('❌ | Sintaxe incorreta. Por favor, mencione um usuário ou forneça um ID.');
        }

        let user;
        try {
            // Tenta obter o usuário por menção primeiro
            const mentionedUser = message.mentions.users.first();
            if (mentionedUser) {
                user = mentionedUser;
            } else {
                // Se não houver menção, tenta buscar pelo ID no primeiro argumento
                user = await client.users.fetch(args[0]);
            }
        } catch (error) {
            return message.reply('❌ | Não foi possível encontrar este usuário. Verifique se o ID está correto.');
        }

        if (!user) {
            return message.reply('❌ | Usuário inválido.');
        }
        // --- Fim da lógica para encontrar o usuário ---

        try {
            // --- 2. Leitura dos Dados (Sem alterações aqui) ---
            const premiumData = getPremiumUsers();

            // --- 3. Verifica se o usuário já é premium (Sem alterações aqui) ---
            if (premiumData.users.includes(user.id)) {
                // Alterado para 'message.reply' e removido 'ephemeral'
                return message.reply(`🟡 | O usuário **${user.username}** já consta na lista de membros Premium.`);
            }

            // --- 4. Adiciona o usuário e salva no arquivo (Sem alterações aqui) ---
            premiumData.users.push(user.id);
            fs.writeFileSync(premiumFilePath, JSON.stringify(premiumData, null, 2));

            // --- 5. Envia confirmação visual ---
            const embed = new MessageEmbed()
                .setColor('#FFD700')
                .setTitle('✨ Status Premium Adicionado!')
                .setDescription(`O usuário **${user.username}** foi adicionado com sucesso à base de dados Premium.`)
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                // Alterado de 'interaction.user.username' para 'message.author.username'
                .setFooter({ text: `Status concedido por: ${message.author.username}` });

            // Alterado de 'interaction.reply' para 'message.channel.send'
            await message.channel.send({ embeds: [embed] });
            // Alterado de 'interaction.user.tag' para 'message.author.tag'
            logger.log(`[PREMIUM] ${user.tag} (ID: ${user.id}) foi adicionado à lista premium por ${message.author.tag}.`);

        } catch (error) {
            console.error(error);
            logger.log(`[PREMIUM ERROR] Falha ao adicionar ${user.tag} ao premium.json: ${error.message}`);
            
            // Alterado para 'message.reply' e removido 'ephemeral'
            await message.reply('❌ | Ocorreu um erro inesperado ao tentar modificar a base de dados Premium. Verifique os logs do console.');
        }
    }
};