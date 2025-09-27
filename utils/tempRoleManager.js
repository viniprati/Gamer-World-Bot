const fs = require('fs');
const path = require('path');

const TEMP_ROLES_PATH = path.join(__dirname, '..', 'temp_roles.json');

function loadTempRoles() {
    if (!fs.existsSync(TEMP_ROLES_PATH)) return [];
    try {
        return JSON.parse(fs.readFileSync(TEMP_ROLES_PATH, 'utf8'));
    } catch {
        return [];
    }
}

function saveTempRoles(data) {
    fs.writeFileSync(TEMP_ROLES_PATH, JSON.stringify(data, null, 2));
}

async function checkExpiredRoles(client) {
    // console.log('[TempRoleManager] Verificando cargos expirados...');
    let tempRoles = loadTempRoles();
    const now = Date.now();
    
    const expiredRoles = tempRoles.filter(r => r.expiresAt <= now);
    if (expiredRoles.length === 0) return;

    console.log(`[TempRoleManager] Encontrados ${expiredRoles.length} cargos expirados para remover.`);

    for (const tempRole of expiredRoles) {
        try {
            const guild = await client.guilds.fetch(tempRole.guildId);
            const member = await guild.members.fetch(tempRole.userId);
            
            if (member.roles.cache.has(tempRole.roleId)) {
                await member.roles.remove(tempRole.roleId);
                console.log(`[TempRoleManager] Removido o cargo ${tempRole.roleId} do usuário ${tempRole.userId}.`);
                // Opcional: Enviar DM para o usuário avisando que o cargo expirou.
            }
        } catch (error) {
            // Ignora erros comuns como "Unknown Member" (usuário saiu) ou "Unknown Role" (cargo foi deletado)
            if (error.code === 10007 || error.code === 10011) {
                 console.log(`[TempRoleManager] Usuário ou cargo não encontrado, removendo da lista. ID: ${tempRole.userId}`);
            } else {
                console.error(`[TempRoleManager] Erro ao remover cargo expirado:`, error);
            }
        }
    }
    
    // Remove os cargos processados da lista e salva o arquivo
    const remainingRoles = tempRoles.filter(r => r.expiresAt > now);
    saveTempRoles(remainingRoles);
}

function startTempRoleMonitor(client) {
    console.log('✅ Monitor de Cargos Temporários iniciado.');
    // Verifica a cada minuto
    setInterval(() => checkExpiredRoles(client), 60 * 1000); 
}

module.exports = { startTempRoleMonitor };