// ===================================================================
// ARQUIVO DE CONFIGURAÇÃO E LÓGICA DAS INSÍGNIAS (badgeManager.js)
// ===================================================================

const staffRoles = ['1388277190973722655', '1388277351548194847', '1388277425703616745', '1388277461560721438', '1388277465029283931'];
const vipRoles = { prata: '1389915201641512960', ouro: '1389915441157115934', diamante: '1389915552084004884' };

// --- CONFIGURAÇÃO CENTRAL DE INSÍGNIAS ---
// Adicione ou edite insígnias aqui! Emoji, nome e descrição de como obter.
const BADGES_CONFIG = [
    // --- Insígnias Especiais ---
    {
        emoji: '👑', name: 'Criador',
        description: 'Ser o criador do bot.',
        condition: (member) => member.id === '983870132063453235' // Coloque SEU ID de usuário aqui
    },
    {
        emoji: '🛡️', name: 'Staff',
        description: 'Fazer parte da equipe de moderação.',
        condition: (member) => staffRoles.some(id => member.roles.cache.has(id))
    },
    {
        emoji: '🚀', name: 'Server Booster',
        description: 'Impulsionar o servidor com Discord Nitro.',
        condition: (member) => member.roles.cache.has('269613958988562433')
    },
    {
        emoji: '🎖️', name: 'Apoiador Inicial',
        description: 'Ter o cargo de Apoiador Inicial.',
        condition: (member) => member.roles.cache.has('1396916524551372800')
    },

    // --- Insígnias de VIP ---
    {
        emoji: '💎', name: 'VIP Prata',
        description: 'Comprar o VIP Prata na `!loja`.',
        condition: (member) => member.roles.cache.has(vipRoles.prata)
    },
    {
        emoji: '💎', name: 'VIP Ouro',
        description: 'Comprar o VIP Ouro na `!loja`.',
        condition: (member) => member.roles.cache.has(vipRoles.ouro)
    },
    {
        emoji: '💎', name: 'VIP Diamante',
        description: 'Comprar o VIP Diamante na `!loja`.',
        condition: (member) => member.roles.cache.has(vipRoles.diamante)
    },
    {
        emoji: '💎', name: 'Gemado',
        description: 'Possuir todos os VIPs ao mesmo tempo.',
        condition: (member) => Object.values(vipRoles).every(id => member.roles.cache.has(id))
    },

    // --- Insígnias de Tempo no Servidor ---
    {
        emoji: '🎖️', name: 'Profissional do GamerWorld',
        description: 'Estar no servidor por mais de 1 ano.',
        condition: (member) => member.joinedTimestamp && (Date.now() - member.joinedTimestamp) >= 31536000000 // 1 ano
    },
    {
        emoji: '🏅', name: 'Veterano do GamerWorld',
        description: 'Estar no servidor por mais de 6 meses.',
        condition: (member) => member.joinedTimestamp && (Date.now() - member.joinedTimestamp) >= 15768000000 // 6 meses
    },

    // --- Insígnias de Economia ---
    {
        emoji: '💎', name: 'Bilionário das GameCoins',
        description: 'Acumular 1 bilhão de moedas.',
        condition: (member, userData) => (userData?.balance || userData || 0) >= 1_000_000_000
    },
    {
        emoji: '💵', name: 'Milionário das GameCoins',
        description: 'Acumular 1 milhão de moedas.',
        condition: (member, userData) => (userData?.balance || userData || 0) >= 1_000_000
    },
    {
        emoji: '💰', name: 'Magnata',
        description: 'Estar no Top 3 do ranking com mais de 100.000 moedas.',
        condition: (member, userData, topRanking) => topRanking > 0 && topRanking <= 3 && (userData?.balance || userData || 0) >= 100_000
    },

    // --- Insígnias de Atividade ---
    {
        emoji: '🥇', name: 'Do top ninguém me tira!',
        description: 'Permanecer no Top 1 do ranking por uma semana.',
        condition: (member, userData, topRanking) => topRanking === 1 && userData.topOneWeek
    },
];



function getBadges(member, userData = {}, topRanking = 0) {
    const badges = BADGES_CONFIG
        .filter(badge => {
            try { return badge.condition(member, userData, topRanking); }
            catch { return false; }
        })
        .map(badge => `${badge.emoji} ${badge.name}`);
    
    return badges.length > 0 ? badges.join('\n') : 'Nenhuma insígnia';
}

function getAllBadges() {
    return BADGES_CONFIG.map(badge => ({
        name: `${badge.emoji} ${badge.name}`,
        value: `*Como obter: ${badge.description}*`,
        inline: false
    }));
}

module.exports = { getBadges, getAllBadges };