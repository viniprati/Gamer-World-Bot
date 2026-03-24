const fs = require('fs');
const path = require('path');
const { checkAndBackup } = require('./backupManager');

const ECONOMY_PATH = path.join(__dirname, '..', 'economy.json');

function loadEconomy() {
    try {
        if (!fs.existsSync(ECONOMY_PATH)) return {};
        const raw = fs.readFileSync(ECONOMY_PATH, 'utf8');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveEconomy(data, client = null) {
    fs.writeFileSync(ECONOMY_PATH, JSON.stringify(data, null, 2));
    if (client) checkAndBackup(client, ECONOMY_PATH);
}

function getBalance(data, userId) {
    const value = data[userId];
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') return Number(value.balance) || 0;
    return 0;
}

function setBalance(data, userId, balance) {
    data[userId] = Math.max(0, Number(balance) || 0);
}

function addBalance(data, userId, amount) {
    const next = getBalance(data, userId) + (Number(amount) || 0);
    setBalance(data, userId, next);
    return getBalance(data, userId);
}

function subtractBalance(data, userId, amount) {
    const next = getBalance(data, userId) - (Number(amount) || 0);
    setBalance(data, userId, next);
    return getBalance(data, userId);
}

function sortRanking(data) {
    return Object.entries(data)
        .map(([userId]) => [userId, getBalance(data, userId)])
        .sort(([, a], [, b]) => b - a);
}

module.exports = {
    ECONOMY_PATH,
    loadEconomy,
    saveEconomy,
    getBalance,
    setBalance,
    addBalance,
    subtractBalance,
    sortRanking,
};
