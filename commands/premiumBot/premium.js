const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ===================================================================
// CONFIGURAÇÃO - Altere estas informações!
// ===================================================================
const PREMIUM_PRICE = 'R$ 7,90';
const PIX_QR_CODE_IMAGE_URL = 'https://i.imgur.com/example.png'; // SUBSTITUA PELO SEU LINK
const YOUR_DISCORD_USER_ID = '983870132063453235'; // SEU ID DE USUÁRIO

module.exports = {
    // --- NOVO: Definição para o Slash Command ---
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Apoie o bot e veja como obter acesso Premium!'),

    // --- ANTIGO: Informações para o Prefix Command ---
    name: 'premium',
    aliases: ['apoie', 'doar'],
    description: 'Apoie o bot e veja como obter acesso Premium!',
    cooldown: 60,

    async execute(client, interactionOrMessage, args) {
        // --- NOVO: Camada de Abstração ---
        const isSlash = interactionOrMessage.isChatInputCommand?.();
        const reply = (options) => {
            return isSlash ? interactionOrMessage.reply(options) : interactionOrMessage.reply(options);
        };
        // --- FIM DA CAMADA DE ABSTRAÇÃO ---

        // A partir daqui, o resto do seu código permanece o mesmo.

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🌟 Torne-se um Apoiador Premium!')
            .setDescription('Obrigado pelo seu interesse em apoiar o desenvolvimento e a manutenção do Gamer World Bot! Sua contribuição nos ajuda a manter o bot rápido, online e com novos recursos.')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '✨ Benefícios Premium',
                    value: '› **Cargo Exclusivo** no servidor.\n' +
                           '› **Dobre** os ganhos de moedas no `!daily` e `!work`.\n' +
                           '› Acesso a **comandos exclusivos** (em breve!).\n' +
                           '› Nossa eterna gratidão!',
                    inline: false
                },
                {
                    name: `💸 Como Apoiar (Valor: ${PREMIUM_PRICE})`,
                    value: 'Escaneie o QR Code abaixo com o aplicativo do seu banco ou use a chave Pix aleatória (se tiver).',
                    inline: false
                },
                {
                    name: '✅ Como Ativar seu Premium',
                    value: `Após realizar o pagamento, por favor, envie uma **mensagem direta (DM)** para <@${YOUR_DISCORD_USER_ID}> com o **comprovante**.\n\nSeu acesso será ativado manualmente em até 24 horas.`,
                    inline: false
                }
            )
            .setImage(PIX_QR_CODE_IMAGE_URL)
            .setFooter({ text: 'Seu apoio faz toda a diferença!' })
            .setTimestamp();

        const contactButton = new ButtonBuilder()
            .setLabel('Enviar Comprovante')
            .setStyle(ButtonStyle.Link)
            // Melhoria: Usando a variável do topo para o link
            .setURL(`https://discord.com/users/${YOUR_DISCORD_USER_ID}`)
            .setEmoji('🧾');
            
        const row = new ActionRowBuilder().addComponents(contactButton);

        // Usa a função de resposta unificada
        await reply({ embeds: [embed], components: [row] });
    },
};