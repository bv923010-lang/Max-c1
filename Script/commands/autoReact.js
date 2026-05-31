/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ autoReact.js — অটো সিন + অটো রিঅ্যাক্ট
  BELAL BOTX666 | Master: Belal YT
  
  🔧 BUG FIX:
  - config.name "autoreact" → "autoReact" (case match)
  - handleEvent এখন Script/events/ এ নয়, commands/ এ আছে
    তাই eventRegistered এ push হতে হবে — index.js এ
    cmd.handleEvent check দিয়ে সেটা হচ্ছে ✅
  - autoMarkRead conflict ঠিক করা হয়েছে
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

module.exports.config = {
  name: "autoReact",
  version: "7.0.0",
  hasPermssion: 0,
  author: "Belal YT",
  description: "প্রতিটি মেসেজে অটো রিঅ্যাক্ট দেয় (সবসময় চালু)",
  category: "⚙️ সিস্টেম",
  commandCategory: "noprefix",
  cooldowns: 0,
  noPrefix: true,
};

const EMOJIS = [
  "🥰","😗","🍂","💜","☺️","🖤","🤗","😇","🌺","🥹","😻",
  "😘","🫣","😽","😺","👀","❤️","🧡","💛","💚","💙",
  "🤎","🤍","💫","🫶","✨","💯","🥀","⚡","🌙","🔥","💕",
];

// ── handleEvent: প্রতিটি মেসেজে চলে ──────────────────────
module.exports.handleEvent = async function ({ api, event }) {
  try {
    // শুধু message টাইপে চলবে
    if (!["message", "message_reply"].includes(event.type)) return;
    if (!event.messageID || !event.threadID) return;

    // বট নিজের মেসেজে react করবে না
    const botID = global.config?.botID || api.getCurrentUserID?.();
    if (botID && String(event.senderID) === String(botID)) return;

    // config.json এ autoReact বন্ধ থাকলে চলবে না
    if (global.config?.BOT_MODES?.autoReact === false) return;

    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    // React দেওয়া — error হলে quietly ignore
    api.setMessageReaction(emoji, event.messageID, () => {}, true);

  } catch { /* quietly ignore */ }
};

// ── run: কমান্ড হিসেবে ডাকলে status দেখায় ──────────────
module.exports.run = async function ({ api, event }) {
  const status = global.config?.BOT_MODES?.autoReact !== false ? "🟢 চালু" : "🔴 বন্ধ";
  return api.sendMessage(
    `⚡ অটো-রিঅ্যাক্ট সিস্টেম\n━━━━━━━━━━━━━━\n` +
    `অবস্থা: ${status}\n` +
    `config.json → BOT_MODES.autoReact: true/false দিয়ে নিয়ন্ত্রণ করুন`,
    event.threadID, event.messageID
  );
};

module.exports.onStart = module.exports.run;
