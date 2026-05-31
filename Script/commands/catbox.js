/*
 * catbox.js — Fixed v2.0
 * ✅ utils/index dependency সরানো হয়েছে
 * ✅ inline downloadFile function
 * ✅ cache/ folder auto-create
 */
const fs       = require("fs-extra");
const axios    = require("axios");
const path     = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "catbox",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "ULLASH — Fixed by Belal YT",
  description: "Upload media to Catbox.moe and get direct link",
  commandCategory: "media",
  usages: "[reply to image/video/audio]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, type, messageReply, messageID } = event;

  if (type !== "message_reply" || !messageReply?.attachments?.length)
    return api.sendMessage("❐ একটা ছবি/ভিডিও/অডিওতে reply করে /catbox লেখো।", threadID, messageID);

  const cacheDir = path.join(process.cwd(), "tmp");
  await fs.ensureDir(cacheDir);

  const filePaths = [];

  // Download attachments
  for (let i = 0; i < messageReply.attachments.length; i++) {
    const data = messageReply.attachments[i];
    const ext  = data.type === "photo" ? "jpg"
               : data.type === "video" ? "mp4"
               : data.type === "audio" ? "mp3"
               : data.type === "animated_image" ? "gif" : "dat";
    const filePath = path.join(cacheDir, `catbox_${Date.now()}_${i}.${ext}`);
    try {
      const res = await axios.get(data.url, { responseType: "arraybuffer", timeout: 30000 });
      await fs.writeFile(filePath, Buffer.from(res.data));
      filePaths.push(filePath);
    } catch (e) {
      api.sendMessage(`❌ ফাইল ডাউনলোড ব্যর্থ: ${e.message?.slice(0,80)}`, threadID, messageID);
    }
  }

  if (!filePaths.length) return;

  let msg = "📦 Catbox Upload Results:\n";

  for (const filePath of filePaths) {
    try {
      const form = new FormData();
      form.append("reqtype", "fileupload");
      form.append("fileToUpload", fs.createReadStream(filePath));

      const res = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders(),
        timeout: 60000,
      });
      msg += `✅ ${res.data.trim()}\n`;
    } catch (err) {
      msg += `❌ Upload failed: ${err.message?.slice(0,60)}\n`;
    } finally {
      await fs.remove(filePath).catch(() => {});
    }
  }

  return api.sendMessage(msg.trim(), threadID, messageID);
};
                  
