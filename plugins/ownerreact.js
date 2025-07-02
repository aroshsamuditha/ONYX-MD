const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

// Auto owner react in groups only
cmd({
  on: "body"
},
async (robin, mek, m, { from, senderNumber, isGroup }) => {
    if (!isGroup) return; // Only react in groups
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
