const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// ===================================================================
// CONFIGURAÇÃO - Altere estas informações!
// ===================================================================
const PREMIUM_PRICE = 'R$ 7,90'; // O preço que você quer cobrar
const PIX_QR_CODE_IMAGE_URL = 'SEU_LINK_DA_IMAGEM_DO_QR_CODE_AQUI'; // O link do Imgur
const YOUR_DISCORD_USER_ID = 'SEU_ID_DE_USUARIO_DO_DISCORD_AQUI'; // Seu ID para as pessoas te contatarem

module.exports = {
    name: 'premium',
    aliases: ['apoie', 'doar'],
    description: 'Apoie o bot e veja como obter acesso Premium!',
    cooldown: 60, // Cooldown de 1 minuto para evitar spam
    async execute(message, args, client) {

        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Verde PicPay/Pix
            .setTitle('🌟 Torne-se um Apoiador Premium!')
            .setDescription('Obrigado pelo seu interesse em apoiar o desenvolvimento e a manutenção do Gamer World Bot! Sua contribuição nos ajuda a manter o bot rápido, online e com novos recursos.')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                {
                    name: '✨ Benefícios Premium',
                    value: '› **Cargo Exclusivo** no servidor.\n' +
                           '› **Dobre** os ganhos de moedas no `!daily` e `!work`.\n' +
                           '› Acesso a **comandos exclusivos** (em breve!).\n' +
                           '› Sua eterna gratidão!',
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
            // Mostra o QR Code diretamente no embed
            .setImage(PIX_QR_CODE_IMAGE_URL)
            .setFooter({ text: 'Seu apoio faz toda a diferença!' })
            .setTimestamp();

        // Opcional: Adicionar um botão que leva para a sua DM
        const contactButton = new ButtonBuilder()
            .setLabel('Enviar Comprovante')
            .setStyle(ButtonStyle.Link)
            // Este link especial abre a DM com você!
            .setURL(`https://discord.com/users/${983870132063453235}`)
            .setEmoji('🧾');
            
        const row = new ActionRowBuilder().addComponents(contactButton);

        await message.reply({ embeds: [embed], components: [row] });
    },
};