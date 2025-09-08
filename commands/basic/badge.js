const fs = require('fs');
const path = require('path');

module.exports.getBadges = (member, userData = {}, topRanking = 0) => {
    const badges = [];

    // Staff (apenas uma insígnia de staff)
    const staffRoles = [
        '1388277190973722655', // Fundador
        '1388277351548194847', // Admin
        '1388277425703616745', // Coordenador
        '1388277461560721438', // Moderador
        '1388277465029283931', // Ajudante
    ];
    if (staffRoles.some(id => member.roles.cache.has(id))) badges.push('🛡️ Staff');

    // Apoiador Inicial
    const apoiadorId = '1396916524551372800';
    if (member.roles.cache.has(apoiadorId)) badges.push('🎖️ Apoiador Inicial');

    // VIPs
    const vipRoles = {
        prata: '1389915201641512960',
        ouro: '1389915441157115934',
        diamante: '1389915552084004884',
    };
    for (const [name, id] of Object.entries(vipRoles)) {
        if (member.roles.cache.has(id)) badges.push(`💎 VIP ${name.charAt(0).toUpperCase() + name.slice(1)}`);
    }

    // GamerDaily - já resgatou daily
    if (userData.daily) badges.push('🎯 GamerDaily');

    // Veterano - 6 meses no servidor
    if (member.joinedAt && (Date.now() - member.joinedAt.getTime() >= 1000 * 60 * 60 * 24 * 30 * 6)) {
        badges.push('🏅 Veterano do GamerWorld');
    }

    // Profissional - 1 ano no servidor
    if (member.joinedAt && (Date.now() - member.joinedAt.getTime() >= 1000 * 60 * 60 * 24 * 365)) {
        badges.push('🎖️ Profissional do GamerWorld');
    }

    // Magnata - top 3 com saldo suficiente (ex: 100k)
    if (topRanking > 0 && topRanking <= 3 && userData.balance >= 100_000) badges.push('💰 Magnata');

    // Usuário da GamerWorld - usou algum comando
    if (userData.usedCommands) badges.push('🧩 Usuário da GamerWorld');

    // Doador de GameCoins - doou para alguém
    if (userData.donated) badges.push('🎁 Doador de GameCoins');

    // Milionário das GameCoins - >= 1M moedas
    if (userData.balance >= 1_000_000) badges.push('💵 Milionário das GameCoins');

    // Apoiador - deu sugestão aceita
    if (userData.suggestionAccepted) badges.push('💡 Apoiador');

    // Ajudantes - participou desde o início
    if (userData.earlyContributor) badges.push('🤝 Ajudantes');

    // Gemado/Pagante - comprou todos os VIPs
    if (member.roles.cache.has(vipRoles.prata) && member.roles.cache.has(vipRoles.ouro) && member.roles.cache.has(vipRoles.diamante)) {
        badges.push('💎 Gemado/Pagante');
    }

    // Fidelidade de alto nível - concluiu tudo
    if (userData.completedAll) badges.push('🏆 Fidelidade de Alto Nível');

    // Criador do bot
    if (member.id === 'ID_DO_CRIOADOR') badges.push('👑 Criador');

    // Do top ninguém me tira! - top 1 por uma semana
    if (topRanking === 1 && userData.topOneWeek) badges.push('🥇 Do top ninguém me tira!');

    // Bilionário das GameCoins - >= 1B moedas
    if (userData.balance >= 1_000_000_000) badges.push('💎 Bilionário das GameCoins');

    return badges.length > 0 ? badges.join(' | ') : 'Nenhuma';
};
