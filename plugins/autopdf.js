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
            const fileOrUrl = data[text];
            if (isUrl(fileOrUrl) && fileOrUrl.endsWith('.pdf')) {
                // Handle as URL (existing behavior)
                try {
                    await m.reply('Fetching your PDF... 📄');
                    const buffer = await getBuffer(fileOrUrl);
                    if (!buffer) return m.reply('Failed to download the PDF. The link may be invalid or the file is too large.');
                    await robin.sendMessage(
                      from,
                      {
                        document: buffer,
                        mimetype: 'application/pdf',
                        fileName: fileOrUrl.split("/").pop() || 'file.pdf',
                        caption: `*PDF from:* ${fileOrUrl}`,
                      },
                      { quoted: mek }
                    );
                    await m.reply('> *PDF sent successfully!* 📄');
                } catch (e) {
                    console.error(e);
                    await m.reply(`Error: ${e.message || e}`);
                }
            } else if (typeof fileOrUrl === 'string' && fileOrUrl.endsWith('.pdf')) {
                // Handle as local file path
                const localPath = path.isAbsolute(fileOrUrl) ? fileOrUrl : path.join(__dirname, '../', fileOrUrl);
                if (!fs.existsSync(localPath)) {
                    await m.reply('Local PDF file not found.');
                    return;
                }
                try {
                    await m.reply('Fetching your local PDF... 📄');
                    const buffer = fs.readFileSync(localPath);
                    await robin.sendMessage(
                      from,
                      {
                        document: buffer,
                        mimetype: 'application/pdf',
                        fileName: path.basename(localPath),
                        caption: `*PDF from local file:* ${localPath}`,
                      },
                      { quoted: mek }
                    );
                    await m.reply('> *PDF sent successfully!* 📄');
                } catch (e) {
                    console.error(e);
                    await m.reply(`Error: ${e.message || e}`);
                }
            } else {
                await m.reply('PDF source is invalid. Please provide a valid URL or local file path ending with .pdf');
            }
        }
    }
}); 
