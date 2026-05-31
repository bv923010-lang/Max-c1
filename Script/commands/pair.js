/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  💑 pair.js — ক্যানভাস ছাড়া pair সিস্টেম
  BELAL BOTX666 | Master: Belal YT
  🔧 FIX: canvas মডিউল সম্পূর্ণ বাদ
  ✅ some-random-api দিয়ে ship ছবি বানায়
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";
const axios = require("axios");
const { Readable } = require("stream");

module.exports = {
  config: {
    name: "pair",
    aliases: ["love", "couple", "পেয়ার"],
    version: "4.0.0",
    author: "Belal YT",
    category: "💑 ফান",
    description: "গ্রুপের কারো সাথে pair করো",
    usage: "/pair",
    cooldowns: 10,
    hasPermssion: 0,
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    try {
      api.setMessageReaction("💑", messageID, () => {}, true);

      // গ্রুপের সদস্য তালিকা
      const threadInfo = await api.getThreadInfo(threadID);
      const members = (threadInfo?.participantIDs || [])
        .filter(id => String(id) !== String(senderID) &&
                      String(id) !== String(global.config?.botID));

      if (members.length === 0)
        return api.sendMessage("❌ গ্রুপে pair করার মতো কেউ নেই!", threadID, messageID);

      // র‍্যান্ডম একজন বেছে নাও
      const partnerId = members[Math.floor(Math.random() * members.length)];

      // দুজনের নাম বের করো
      const [info1, info2] = await Promise.all([
        api.getUserInfo(senderID).catch(() => null),
        api.getUserInfo(partnerId).catch(() => null),
      ]);
      const name1 = info1?.[senderID]?.name   || "তুমি";
      const name2 = info2?.[partnerId]?.name  || "সে";

      // প্রোফাইল ছবির URL
      const pic1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&type=large`;
      const pic2 = `https://graph.facebook.com/${partnerId}/picture?width=512&height=512&type=large`;

      // some-random-api ship ছবি
      const shipUrl = `https://some-random-api.com/canvas/misc/ship` +
        `?avatar=${encodeURIComponent(pic1)}&partnersAvatar=${encodeURIComponent(pic2)}`;

      const love = Math.floor(Math.random() * 31) + 70; // ৭০-১০০%
      const loveBar = "❤️".repeat(Math.floor(love / 10)) + "🖤".repeat(10 - Math.floor(love / 10));

      const msg =
        `╔══════════════════════════╗\n` +
        `║    💑 পেয়ার রিপোর্ট     ║\n` +
        `╚══════════════════════════╝\n\n` +
        `👤 ${name1}\n` +
        `        ❤️\n` +
        `👤 ${name2}\n\n` +
        `${loveBar}\n` +
        `💕 ভালোবাসার মিল: ${love}%\n\n` +
        (love >= 90 ? "🔥 পারফেক্ট ম্যাচ! তোমরা একে অপরের জন্যই তৈরি!" :
         love >= 80 ? "💖 দারুণ মিল! তোমাদের ভবিষ্যৎ উজ্জ্বল!" :
         love >= 70 ? "😊 ভালোই আছে! একটু চেষ্টা করলেই পারফেক্ট!" :
         "🙈 একটু কম মিল, কিন্তু ভালোবাসায় সব হয়!") +
        `\n\n┄┉❈✡️⋆⃝চাঁদেড়~পাহাড়🪬❈┉┄`;

      // ship ছবি নামাও
      try {
        const res = await axios.get(shipUrl, { responseType: "arraybuffer", timeout: 15000 });
        const buf = Buffer.from(res.data);
        const stream = Readable.from(buf);
        stream.path = "pair.png";

        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage({ body: msg, attachment: stream }, threadID, messageID);
      } catch {
        // ছবি না পেলে শুধু টেক্সট পাঠাও
        api.setMessageReaction("✅", messageID, () => {}, true);
        return api.sendMessage(msg, threadID, messageID);
      }

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage(`❌ সমস্যা হয়েছে: ${err.message?.slice(0, 100)}`, threadID, messageID);
    }
  },

  run: async function (ctx) { return module.exports.onStart(ctx); },
};
           
