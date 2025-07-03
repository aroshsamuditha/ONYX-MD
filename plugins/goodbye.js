// Goodbye plugin for members who leave the group
// Usage: called from index.js when a member leaves

const GOODBYE_IMAGE = "https://raw.githubusercontent.com/aroshsamuditha/ONYX-MEDIA/refs/heads/main/oNYX%20bOT.jpg";
const GOODBYE_STICKER = "https://github.com/aroshsamuditha/ONYX-MEDIA/raw/refs/heads/main/sticker/alive%20msg.webp";

/**
 * Sends a goodbye message with image, sticker, and custom formatting.
 * @param {object} robin - The Baileys socket instance
 * @param {string} groupId - The group JID
 * @param {string[]} leftMembers - Array of member JIDs who left
 */
module.exports = async function (robin, groupId, leftMembers) {
  try {
    // Fetch group metadata for group name
    let groupMetadata = await robin.groupMetadata(groupId);
    let groupName = groupMetadata.subject || "this group";

    for (const member of leftMembers) {
      // Custom goodbye message
      const caption = `👋 *Goodbye from ${groupName}!*\n@${member.split("@")[0]}, we are sad to see you go!\n\n🌀ONYX MD🔥BOT👾`;

      // Send image with caption
      await robin.sendMessage(groupId, {
        image: { url: GOODBYE_IMAGE },
        caption,
        mentions: [member],
      });

      // Send sticker
      await robin.sendMessage(groupId, {
        sticker: { url: GOODBYE_STICKER },
      });
    }
  } catch (e) {
    console.log("[GOODBYE PLUGIN ERROR]", e);
  }
}; 