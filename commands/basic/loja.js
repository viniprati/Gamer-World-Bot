const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'loja',
    description: 'Mostra os links de promoções e parcerias do servidor.',
    async execute(message, args, client) {
        // Você pode configurar estas informações em um arquivo de configuração ou puxar de uma API
        const links = [
            {
                nome: "PC Gamer XYZ - 15% OFF",
                descricao: "Monte seu PC dos sonhos com um desconto exclusivo para membros do nosso servidor!",
                link: "https://link-parceria-pc.com"
            },
            {
                nome: "Acessórios Gamer Store - Cupom GW10",
                descricao: "10% de desconto em mouses, teclados, headsets e mais!",
                link: "https://link-parceria-acessorios.com"
            },
            {
                nome: "Promoção de Jogos na Steam - Até 70% OFF",
                descricao: "Fique de olho nas melhores ofertas da Steam selecionadas por nós!",
                link: "https://store.steampowered.com/specials"
            }
        ];

        const embed = new EmbedBuilder()
            .setColor('#2ECC71') // Cor verde para loja/promoções
            .setTitle('🛒 Promoções e Parcerias do Gamer World Bot')
            .setDescription('Confira as melhores ofertas e descontos exclusivos para a nossa comunidade gamer!')
            .setTimestamp()
            .setFooter({ text: 'Aproveite enquanto duram!' });

        links.forEach(item => {
            embed.addFields(
                { name: item.nome, value: `${item.descricao}\n[**Ver Oferta**](${item.link})`, inline: false }
            );
        });

        message.channel.send({ embeds: [embed] });
    },
};