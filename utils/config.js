const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const CONFIG_JSON_PATH = path.join(__dirname, '..', 'config.json');

function loadJsonFallback() {
    try {
        if (!fs.existsSync(CONFIG_JSON_PATH)) return {};
        const raw = fs.readFileSync(CONFIG_JSON_PATH, 'utf8');
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

const jsonConfig = loadJsonFallback();

const KEY_ALIASES = {
    TOKEN: 'token',
    PREFIX: 'prefix',
    OWNER_ID: 'ownerId',
    CLIENT_ID: 'clientId',
    GUILD_ID: 'guildId',
};

function getConfig(key, fallback = undefined) {
    const envValue = process.env[key];
    if (envValue !== undefined && envValue !== '') return envValue;
    if (jsonConfig[key] !== undefined) return jsonConfig[key];

    const alias = KEY_ALIASES[key] || key.toLowerCase();
    if (jsonConfig[alias] !== undefined) return jsonConfig[alias];
    return fallback;
}

function getRequiredConfig(key) {
    const value = getConfig(key);
    if (value === undefined || value === null || value === '') {
        throw new Error(`[Config] Variavel obrigatoria ausente: ${key}`);
    }
    return value;
}

function getIdList(key, fallback = []) {
    const value = getConfig(key);
    if (Array.isArray(value)) return value.map(String).filter(Boolean);
    if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(Boolean);
    }
    return fallback;
}

module.exports = {
    getConfig,
    getRequiredConfig,
    getIdList,
    rawConfig: jsonConfig,
};
