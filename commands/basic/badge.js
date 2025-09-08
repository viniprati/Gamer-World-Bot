const fs = require('fs');
const path = require('path');

module.exports.getBadges = (member, userData = {}, topRanking = 0) => {
    const badges = [];

    // Staff (apenas uma insígnia)
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

    // GamerDaily
    if (userData.daily) badges.push('🎯 GamerDaily');

    // Veterano - 6 meses
    if (member.joinedAt && (Date.now() - member.joinedAt.getTime() >= 1000 * 60 * 60 * 24 * 30 * 6)) {
        badges.push('🏅 Veterano do GamerWorld');
    }

    // Profissional - 1 ano
    if (member.joinedAt && (Date.now() - member.joinedAt.getTime() >= 1000 * 60 * 60 * 24 * 365)) {
        badges.push('🎖️ Profissional do GamerWorld');
    }

    // Magnata - top 3
    if (topRanking > 0 && topRanking <= 3) badges.push('💰 Magnata');

    // Usuário da GamerWorld
    if (userData.usedCommands) badges.push('🧩 Usuário da GamerWorld');

    // Doador de GameCoins
    if (userData.donated) badges.push('🎁 Doador de GameCoins');

    // Milionário - >= 1M moedas
    if (userData.balance >= 1_000_000) badges.push('💵 Milionário das GameCoins');

    // Apoiador - sugestão aceita
    if (userData.suggestionAccepted) badges.push('💡 Apoiador');

    // Ajudantes - early contributor
    if (userData.earlyContributor) badges.push('🤝 Ajudantes');

    // Gemado/Pagante - todos VIPs
    if (Object.values(vipRoles).every(id => member.roles.cache.has(id))) badges.push('💎 Gemado/Pagante');

    // Fidelidade de alto nível - concluiu tudo
    if (userData.completedAll) badges.push('🏆 Fidelidade de Alto Nível');

    // Criador do bot
    if (member.id === 'ID_DO_CRIOADOR') badges.push('👑 Criador');

    // Do top ninguém me tira! - top 1 por 7 dias
    const top1Path = path.join(__dirname, '../../top1.json');
    if (fs.existsSync(top1Path)) {
        const top1Data = JSON.parse(fs.readFileSync(top1Path, 'utf8'));
        if (top1Data.topUserId === member.id) {
            const top1Date = new Date(top1Data.top1Start);
            const diffDays = (Date.now() - top1Date.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= 7) badges.push('🥇 Do top ninguém me tira!');
        }
    }

    // Bilionário - >= 1B moedas
    if (userData.balance >= 1_000_000_000) badges.push('💎 Bilionário das GameCoins');

    return badges.length > 0 ? badges.join(' | ') : 'Nenhuma';
};
