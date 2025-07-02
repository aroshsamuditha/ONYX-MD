const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

// Auto owner react
cmd({
  on: "body"
},
async (robin, mek, m, { from, senderNumber }) => {
    const filePath = path.join(__dirname, '../data/ownerreact.json');
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const owner in data) {
        if (senderNumber === owner.replace('+', '')) {
            const emoji = data[owner];
            await robin.sendMessage(from, { react: { text: emoji, key: mek.key } });
        }
    }
}); 