/*
 * prefix.js — Dynamic Prefix Switcher
 * ✅ Triple-lock: শুধু hardcoded owner UIDs
 * ✅ Promise.any() দিয়ে parallel stream — fastest delivery
 * ✅ Prefix বদলালে config.json-এ save হয়
 * ✅ Triggers: "prefix", "prefix + /", "no prefix", ইত্যাদি
 */
"use strict";

const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

// ── Hardcoded owner UIDs — শুধু এই দুইজন use করতে পারবে ──
const OWNER_UIDS = ["61577502464880", "1000152450"];

const VIDEOS = [
  "https://i.imgur.com/qUJvQud.mp4","https://i.imgur.com/HFudaEm.mp4",
  "https://i.imgur.com/i8nxwCR.mp4","https://i.imgur.com/zygQoCK.mp4",
  "https://i.imgur.com/qYTXUUb.mp4","https://i.imgur.com/zqVszYj.mp4",
  "https://i.imgur.com/AmXhkTP.mp4","https://i.imgur.com/T3yb7jy.mp4",
  "https://i.imgur.com/Bfq83Nl.mp4","https://i.imgur.com/iWRa1uU.mp4",
  "https://i.imgur.com/YniEZIV.mp4","https://i.imgur.com/gBrSoBB.mp4",
  "https://i.imgur.com/uetKIMp.mp4","https://i.imgur.com/2YJexzw.mp4",
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Referer":    "https://imgur.com/",
};

// ── Promise.any() parallel stream — সবচেয়ে দ্রুত যেটা আসে ──
async function fastStream(links) {
  const pick = () => links[Math.floor(Math.random() * links.length)];
  const attempts = [pick(), pick(), pick()];
  const streams = attempts.map(url =>
    axios({ method: "GET", url, responseType: "stream", headers: HEADERS, timeout: 15000, maxRedirects: 5 })
      .then(r => { r.data.path = "prefix.mp4"; return r.data; })
  );
  return Promise.any(streams);
}

module.exports = {
  config: {
    name: "prefix",
    version: "2.0.0",
    author: "Belal YT",
    countDown: 5,
    role: 0,
    hasPermssion: 0,
    shortDescription: "Prefix পরিবর্তন করুন (শুধু Owner)",
    category: "owner",
    guide: { en: "prefix + /\nprefix + !\nno prefix" },
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    const bodyLower = (body || "").trim().toLowerCase();

    // ── Triple-lock security ─────────────────────────────
    if (!OWNER_UIDS.includes(String(senderID))) {
      return api.sendMessage(
        "🔒 এই কমান্ডটি শুধুমাত্র মাস্টার বেলাল (Oᴡɴᴇʀ) এর জন্য সুরক্ষিত।",
        threadID, messageID
      );
    }

    // ── Parse new prefix ─────────────────────────────────
    let newPrefix = null;
    let modeName  = "";

    if (bodyLower === "no prefix" || bodyLower === "prefix no" || bodyLower === "noprefix") {
      newPrefix = "";
      modeName  = "No-Prefix Mode 🔓";
    } else if (bodyLower.startsWith("prefix +")) {
      const extracted = body.trim().slice("prefix +".length).trim();
      if (!extracted) {
        return api.sendMessage(
          "❌ Prefix দিন। উদাহরণ:\nprefix + /\nprefix + !\nprefix + $\nno prefix",
          threadID, messageID
        );
      }
      newPrefix = extracted;
      modeName  = `Prefix Mode: "${newPrefix}" ✅`;
    } else if (bodyLower === "prefix") {
      // শুধু "prefix" লিখলে — current prefix দেখাও
      const cur = global.config?.PREFIX;
      return api.sendMessage(
        `📌 বর্তমান Prefix: "${cur === "" ? "(কোনো prefix নেই)" : cur}"\n\n` +
        `পরিবর্তন করতে:\nprefix + /\nprefix + !\nno prefix`,
        threadID, messageID
      );
    } else {
      return api.sendMessage(
        "❌ ব্যবহার:\nprefix + /\nprefix + !\nprefix + $\nno prefix",
        threadID, messageID
      );
    }

    // ── Update config in memory ──────────────────────────
    global.config.PREFIX = newPrefix;

    // ── Save to config.json permanently ─────────────────
    try {
      const cfgPath = path.join(process.cwd(), "config.json");
      const cfg     = await fs.readJson(cfgPath);
      cfg.PREFIX    = newPrefix;
      await fs.writeJson(cfgPath, cfg, { spaces: 2 });
    } catch (e) {
      global.log?.warn(`config.json save ব্যর্থ: ${e.message}`);
    }

    // ── Send video with style ────────────────────────────
    const styleText =
      `╔══════════════════════╗\n` +
      `║  🔧 PREFIX UPDATED   ║\n` +
      `╚══════════════════════╝\n\n` +
      `✅ ${modeName}\n\n` +
      `┄┉❈✡️⋆⃝চাঁদেড়~পাহাড়✿⃝🪬❈┉┄\n` +
      `👑 Owner: Belal YT`;

    try {
      const stream = await fastStream(VIDEOS);
      api.sendMessage({ body: styleText, attachment: stream }, threadID, messageID);
    } catch {
      // Video আনতে ব্যর্থ হলেও text পাঠাও
      api.sendMessage(styleText, threadID, messageID);
    }
  },
};


    
