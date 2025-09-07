const staffRoles = {
    fundador: "1388277190973722655",
    admin: "1388277351548194847",
    coordenador: "1388277425703616745",
    moderador: "1388277461560721438",
    ajudante: "1388277465029283931"
};

function getBadges(member) {
    const badges = [];

    if (member.roles.cache.has(staffRoles.fundador)) {
        badges.push("👑 Fundador");
    }
    if (member.roles.cache.has(staffRoles.admin)) {
        badges.push("⚔️ Admin");
    }
    if (member.roles.cache.has(staffRoles.coordenador)) {
        badges.push("📢 Coordenador");
    }
    if (member.roles.cache.has(staffRoles.moderador)) {
        badges.push("🛡️ Moderador");
    }
    if (member.roles.cache.has(staffRoles.ajudante)) {
        badges.push("🤝 Ajudante");
    }

    return badges.length > 0 ? badges.join(" | ") : "Nenhuma insígnia";
}

module.exports = { getBadges };
