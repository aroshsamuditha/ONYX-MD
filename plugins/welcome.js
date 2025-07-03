// Welcome plugin for new group members
// Usage: called from index.js when a new member joins

const WELCOME_IMAGE = "https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg";
const WELCOME_STICKER = "https://github.com/aroshsamuditha/ONYX-MEDIA/raw/refs/heads/main/sticker/alive%20msg.webp";

/**
 * Sends a welcome message with image, sticker, and custom formatting.
 * @param {object} robin - The Baileys socket instance
 * @param {string} groupId - The group JID
 * @param {string[]} newMembers - Array of new member JIDs
 */
module.exports = async function (robin, groupId, newMembers) {
  try {
    // Fetch group metadata for group name
    let groupMetadata = await robin.groupMetadata(groupId);
    let groupName = groupMetadata.subject || "this group";

    for (const member of newMembers) {
      // Custom welcome message
      const caption = `👋 *Welcome to ${groupName}!*\n\n@${member.split("@")[0]}, we are glad to have you here!\n\n🌀ONYX MD🔥BOT👾`;

      // Send image with caption
      await robin.sendMessage(groupId, {
        image: { url: WELCOME_IMAGE },
        caption,
        mentions: [member],
      });

      // Send sticker
      await robin.sendMessage(groupId, {
        sticker: { url: WELCOME_STICKER },
      });
    }
  } catch (e) {
    console.log("[WELCOME PLUGIN ERROR]", e);
  }
}; 