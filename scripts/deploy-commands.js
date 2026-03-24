const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const { getRequiredConfig, getConfig } = require('../utils/config');

const token = getRequiredConfig('TOKEN');
const clientId = getRequiredConfig('CLIENT_ID');
const guildId = getConfig('GUILD_ID');

function loadCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, '..', 'commands');
    const folders = fs.readdirSync(commandsPath);

    for (const folder of folders) {
        const folderPath = path.join(commandsPath, folder);
        if (!fs.lstatSync(folderPath).isDirectory()) continue;
        const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of files) {
            const command = require(path.join(folderPath, file));
            if (command?.data?.toJSON) {
                commands.push(command.data.toJSON());
            }
        }
    }
    return commands;
}

async function deploy() {
    const commands = loadCommands();
    const rest = new REST({ version: '10' }).setToken(token);

    if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log(`[Deploy] ${commands.length} comandos registrados na guild ${guildId}.`);
    } else {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(`[Deploy] ${commands.length} comandos globais registrados.`);
    }
}

deploy().catch(error => {
    console.error('[Deploy] Falha ao registrar comandos:', error);
    process.exit(1);
});
