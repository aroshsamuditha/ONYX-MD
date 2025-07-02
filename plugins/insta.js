
const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "ig",
    alias: ["instagram"],
    desc: "Download Instagram Video or Reel",
    category: "download",
    react: "📸",
    filename: __filename,
  },
  async (robin, mek, m, { reply, q }) => {
    if (!q) return reply("⚠ *Mana Link Instagramnya?*");
    try {
      reply("🌀ONYX MD🔥DOWNLOADING...");
      const apiUrl = `https://www.velyn.biz.id/api/downloader/instagram?url=${encodeURIComponent(q)}`;
      const response = await axios.get(apiUrl);

      if (!response.data.status || !response.data.data.url[0]) {
        return reply("❌ Link tidak valid atau API error");
      }

      const data = response.data.data;
      const mediaUrl = data.url[0];
      const metadata = data.metadata;

      if (metadata.isVideo) {
        await robin.sendMessage(
          mek.key.remoteJid,
          {
            video: { url: mediaUrl },
            caption:
              `*🌀ONYX MD🔥Instagram Reel*\n\n` +
              `*Username :* ${metadata.username}\n` +
              `*Likes :* ${metadata.like.toLocaleString()}\n` +
              `*Comments :* ${metadata.comment.toLocaleString()}\n\n` +
              `*Caption :* ${metadata.caption || '-'}\n\n` +
              `*Source :* ${q}\n\n` +
              `> *🌀ONYX MD🔥BY AROSH*`,
          },
          { quoted: mek }
        );
      } else {
        await robin.sendMessage(
          mek.key.remoteJid,
          {
            image: { url: mediaUrl },
            caption:
              `*Instagram Post*\n\n` +
              `*Username :* ${metadata.username}\n` +
              `*Likes :* ${metadata.like.toLocaleString()}\n\n` +
              `*Caption :* ${metadata.caption || '-'}`,
          },
          { quoted: mek }
        );
      }
    } catch (error) {
      console.error("Error Instagram DL:", error);
      reply("❌ Gagal mendownload. Pastikan link benar dan publik.");
    }
  }
);
