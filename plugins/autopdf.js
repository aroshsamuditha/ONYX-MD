const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const { getBuffer, isUrl } = require('../lib/functions');

// Auto PDF sender
cmd({
  on: "body"
},
async (robin, mek, m, { from, body }) => {
    const filePath = path.join(__dirname, '../data/autopdf.json');
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const text in data) {
        if (body.toLowerCase() === text.toLowerCase()) {
            const url = data[text];
            if (!isUrl(url) || !url.endsWith('.pdf')) {
                await m.reply('PDF URL is invalid or not a direct PDF link.');
                return;
            }
            try {
                await m.reply('Fetching your PDF... 📄');
                const buffer = await getBuffer(url);
                if (!buffer) return m.reply('Failed to download the PDF. The link may be invalid or the file is too large.');
                await robin.sendMessage(
                  from,
                  {
                    document: buffer,
                    mimetype: 'application/pdf',
                    fileName: url.split("/").pop() || 'file.pdf',
                    caption: `*PDF from:* ${url}`,
                  },
                  { quoted: mek }
                );
                await m.reply('> *PDF sent successfully!* 📄');
            } catch (e) {
                console.error(e);
                await m.reply(`Error: ${e.message || e}`);
            }
        }
    }
}); 