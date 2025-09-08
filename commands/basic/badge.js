const staffRoles = [
  '1388277190973722655', // Fundador
  '1388277351548194847', // Admin
  '1388277425703616745', // Coordenador
  '1388277461560721438', // Moderador
  '1388277465029283931', // Ajudante
];

const vipRoles = {
  prata: '1389915201641512960',
  ouro: '1389915441157115934',
  diamante: '1389915552084004884',
};

// === Funções de badges ===
function getStaffBadge(member) {
  return staffRoles.some(id => member.roles.cache.has(id)) ? ['🛡️ Staff'] : [];
}

function getApoiadorInicialBadge(member) {
  return member.roles.cache.has('1396916524551372800') ? ['🎖️ Apoiador Inicial'] : [];
}

function getVipBadges(member) {
  const badges = [];
  for (const [name, id] of Object.entries(vipRoles)) {
    if (member.roles.cache.has(id)) badges.push(`💎 VIP ${name.charAt(0).toUpperCase() + name.slice(1)}`);
  }
  if (Object.values(vipRoles).every(id => member.roles.cache.has(id))) {
    badges.push('💎 Gemado');
  }
  return badges;
}

function getTimeBadges(member) {
  if (!member.joinedAt) return [];
  const diff = Date.now() - member.joinedAt.getTime();
  const sixMonths = 1000 * 60 * 60 * 24 * 30 * 6;
  const oneYear = 1000 * 60 * 60 * 24 * 365;

  if (diff >= oneYear) return ['🎖️ Profissional do GamerWorld'];
  if (diff >= sixMonths) return ['🏅 Veterano do GamerWorld'];
  return [];
}

function getEconomyBadges(userData, topRanking) {
  const badges = [];
  if (topRanking > 0 && topRanking <= 3 && userData.balance >= 100_000) badges.push('💰 Magnata');
  if (userData.balance >= 1_000_000_000) badges.push('💎 Bilionário das GameCoins');
  else if (userData.balance >= 1_000_000) badges.push('💵 Milionário das GameCoins');
  return badges;
}

function getActivityBadges(userData, topRanking) {
  const badges = [];
  if (userData.daily) badges.push('🎯 GamerDaily');
  if (userData.usedCommands) badges.push('🧩 Usuário da GamerWorld');
  if (userData.donated) badges.push('🎁 Doador de GameCoins');
  if (userData.suggestionAccepted) badges.push('💡 Apoiador');
  if (userData.earlyContributor) badges.push('🤝 Ajudantes');
  if (userData.completedAll) badges.push('🏆 Fidelidade de Alto Nível');
  if (topRanking === 1 && userData.topOneWeek) badges.push('🥇 Do top ninguém me tira!');
  return badges;
}

function getCreatorBadge(member) {
  return member.id === 'ID_DO_CRIOADOR' ? ['👑 Criador'] : [];
}

// === Função principal ===
module.exports.getBadges = (member, userData = {}, topRanking = 0) => {
  const badges = [
    ...getStaffBadge(member),
    ...getApoiadorInicialBadge(member),
    ...getVipBadges(member),
    ...getTimeBadges(member),
    ...getEconomyBadges(userData, topRanking),
    ...getActivityBadges(userData, topRanking),
    ...getCreatorBadge(member),
  ];

  return badges.length > 0 ? badges.join(' | ') : 'Nenhuma';
};
