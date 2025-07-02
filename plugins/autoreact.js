const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');

// Auto react
cmd({
  on: "body"
},
async (robin, mek, m, { from, body }) => {
    const filePath = path.join(__dirname, '../data/autoreact.json');
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            const emoji = data[text];
            await robin.sendMessage(from, { react: { text: emoji, key: mek.key } });
        }
    }
}); 