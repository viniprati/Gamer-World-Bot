const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const ms = require('ms');

const TEMP_ROLES_PATH = path.join(__dirname, '..', '..', 'temp_roles.json');

// Funções de leitura/escrita (sem alteração)
function loadTempRoles() {
    if (!fs.existsSync(TEMP_ROLES_PATH)) return [];
    try { return JSON.parse(fs.readFileSync(TEMP_ROLES_PATH, 'utf8')); } catch { return []; }
}
function saveTempRoles(data) {
    fs.writeFileSync(TEMP_ROLES_PATH, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtemprole')
        .setDescription('Adiciona um cargo a um usuário por um tempo determinado.')
        .addUserOption(option => option.setName('usuario').setDescription('O usuário que receberá o cargo.').setRequired(true))
        .addStringOption(option => option.setName('nome_do_cargo').setDescription('O nome do cargo a ser adicionado.').setRequired(true))
        .addStringOption(option => option.setName('duracao').setDescription('Duração (ex: 1d, 7h, 30m).').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

    name: 'addtemprole',
    description: 'Adiciona um cargo a um usuário por um tempo determinado.',
    
    async execute(client, interactionOrMessage, args) {
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const authorMember = isSlash ? interactionOrMessage.member : interactionOrMessage.member;
        const channel = isSlash ? interactionOrMessage.channel : interactionOrMessage.channel;
        
        // Wrapper de resposta
        const reply = async (options) => {
            if (isSlash) {
                if (interactionOrMessage.replied || interactionOrMessage.deferred) return interactionOrMessage.followUp(options);
                return interactionOrMessage.reply(options);
            }
            return interactionOrMessage.reply(options);
        };
        
        if (!authorMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return reply({ content: '❌ Você não tem permissão para gerenciar cargos.', ephemeral: true });
        }

        // --- Parsing de Argumentos ---
        const targetMember = isSlash ? interactionOrMessage.options.getMember('usuario') : interactionOrMessage.mentions.members.first();
        const roleNameQuery = isSlash ? interactionOrMessage.options.getString('nome_do_cargo') : args[1];
        const durationString = isSlash ? interactionOrMessage.options.getString('duracao') : args[2];
        
        // --- Validações Iniciais ---
        if (!targetMember) return reply({ content: '❌ Você precisa especificar um usuário válido.', ephemeral: true });
        if (!roleNameQuery) return reply({ content: '❌ Você precisa especificar o nome de um cargo.', ephemeral: true });
        if (!durationString) return reply({ content: '❌ Você precisa especificar uma duração (ex: 1d, 7h, 30m).', ephemeral: true });

        const durationMs = ms(durationString);
        if (!durationMs || durationMs <= 0) {
            return reply({ content: '❌ Duração inválida. Use um formato como `1d`, `12h`, `30m`.', ephemeral: true });
        }

        // --- Lógica de Busca e Seleção do Cargo ---
        const foundRoles = interactionOrMessage.guild.roles.cache.filter(r => r.name.toLowerCase().includes(roleNameQuery.toLowerCase()) && r.id !== interactionOrMessage.guild.id);

        if (foundRoles.size === 0) {
            return reply({ content: `❌ Nenhum cargo encontrado com o nome "${roleNameQuery}".`, ephemeral: true });
        }

        let role;
        if (foundRoles.size > 1) {
            // Se encontrou múltiplos, pede para o usuário escolher
            const roleList = foundRoles.map((r, i) => `${i + 1} - ${r}`).join('\n');
            const selectionMessage = await reply({ content: `Encontrei múltiplos cargos com o nome "${roleNameQuery}". Qual deles você deseja adicionar?\n\n${roleList}\n\nResponda com o número correspondente em 30 segundos.` });

            const filter = m => m.author.id === authorMember.id && !isNaN(parseInt(m.content)) && parseInt(m.content) > 0 && parseInt(m.content) <= foundRoles.size;
            try {
                const collected = await channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
                const choiceIndex = parseInt(collected.first().content) - 1;
                role = foundRoles.at(choiceIndex);
                await selectionMessage.delete().catch(() => {});
                await collected.first().delete().catch(() => {});
            } catch {
                return selectionMessage.edit({ content: 'Tempo esgotado. Operação cancelada.', components: [] }).catch(() => {});
            }
        } else {
            // Se encontrou apenas um, seleciona automaticamente
            role = foundRoles.first();
        }

        // --- Verificação de Hierarquia ---
        if (role.position >= authorMember.roles.highest.position && authorMember.id !== interactionOrMessage.guild.ownerId) {
            return reply({ content: '❌ Você não pode adicionar um cargo que está acima ou na mesma posição que o seu cargo mais alto.', ephemeral: true });
        }
        if (role.position >= interactionOrMessage.guild.members.me.roles.highest.position) {
            return reply({ content: '❌ Eu não posso adicionar este cargo pois ele está acima ou na mesma posição que o meu.', ephemeral: true });
        }
        
        try {
            await targetMember.roles.add(role);

            const tempRoles = loadTempRoles();
            const expiresAt = Date.now() + durationMs;
            const filteredRoles = tempRoles.filter(r => !(r.userId === targetMember.id && r.roleId === role.id));
            filteredRoles.push({ userId: targetMember.id, guildId: interactionOrMessage.guild.id, roleId: role.id, expiresAt: expiresAt });
            saveTempRoles(filteredRoles);

            const expiresTimestamp = `<t:${Math.floor(expiresAt / 1000)}:R>`;
            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('✅ Cargo Temporário Adicionado!')
                .setDescription(`O cargo ${role} foi adicionado a **${targetMember.user.tag}**.`)
                .addFields({ name: 'Expira em', value: `${durationString} (expira ${expiresTimestamp})` })
                .setTimestamp();

            await reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await reply({ content: '❌ Ocorreu um erro ao tentar adicionar o cargo.', ephemeral: true });
        }
    }
};