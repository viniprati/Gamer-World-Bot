const fs = require('fs');
const path = require('path');

const top1Path = path.join(__dirname, '../../top1.json');
const economyPath = path.join(__dirname, '../../economy.json');

module.exports.updateTop1 = () => {
    const economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
    const top1Data = fs.existsSync(top1Path) ? JSON.parse(fs.readFileSync(top1Path, 'utf8')) : {};

    // Descobre o usuário com mais moedas
    const sorted = Object.entries(economy).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return;

    const [topUserId, topCoins] = sorted[0];

    if (top1Data.topUserId !== topUserId) {
        // Mudou o top 1
        top1Data.topUserId = topUserId;
        top1Data.top1Start = new Date().toISOString();
    }

    fs.writeFileSync(top1Path, JSON.stringify(top1Data, null, 2));
};
