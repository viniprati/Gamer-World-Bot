module.exports.getBadges = (member) => {
    const badges = [];

    // Staff
    const staffRoles = {
        fundador: '1388277190973722655',
        admin: '1388277351548194847',
        coordenador: '1388277425703616745',
        moderador: '1388277461560721438',
        ajudante: '1388277465029283931'
    };

    if (member.roles.cache.has(staffRoles.fundador)) badges.push('👑 **Fundador**');
    if (member.roles.cache.has(staffRoles.admin)) badges.push('🛡️ **Admin**');
    if (member.roles.cache.has(staffRoles.coordenador)) badges.push('🎯 **Coordenador**');
    if (member.roles.cache.has(staffRoles.moderador)) badges.push('🔨 **Moderador**');
    if (member.roles.cache.has(staffRoles.ajudante)) badges.push('🤝 **Ajudante**');

    // VIPs
    const vipRoles = {
        diamante: '1389915552084004884',
        ouro: '1389915441157115934',
        prata: '1389915201641512960'
    };

    if (member.roles.cache.has(vipRoles.diamante)) badges.push('💎 **VIP Diamante**');
    else if (member.roles.cache.has(vipRoles.ouro)) badges.push('🥇 **VIP Ouro**');
    else if (member.roles.cache.has(vipRoles.prata)) badges.push('🥈 **VIP Prata**');

    // Todos recebem a insígnia de apoiador inicial
    badges.push('⭐ **Apoiador Inicial**');

    // Retorna cada insígnia em uma linha
    return badges.length ? badges.map(b => `• ${b}`).join('\n') : 'Nenhuma';
};
