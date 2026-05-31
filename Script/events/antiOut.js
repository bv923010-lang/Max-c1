/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📡 antiOut.js — বট বের হওয়া রোধ
  BELAL BOTX666 | Master: Belal YT

  🔧 BUG FIX:
  - logMessageType চেক আগে করা হচ্ছে (early return)
  - antiOut threadData থেকে চেক হচ্ছে ✅
  - addUserToGroup এর পর delay দেওয়া হয়েছে
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

module.exports.config = {
  name: "antiOut",
  eventType: ["log:unsubscribe"],
  version: "3.0.0",
  description: "বটকে গ্রুপ থেকে বের করার চেষ্টা রোধ করে",
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (event.logMessageType !== "log:unsubscribe") return;

    const { logMessageData, threadID, author } = event;
    const leftID  = String(logMessageData?.leftParticipantFbId || "");
    const botID   = String(global.config?.botID || api.getCurrentUserID?.() || "");

    if (!leftID || leftID !== botID) return;

    // Admin বা NDH বের করলে কিছু করবে না
    const authorStr = String(author || "");
    const admins    = [...(global.config?.ADMINBOT || []), ...(global.config?.NDH || [])];
    if (admins.includes(authorStr)) return;

    // per-thread antiOut সেটিং চেক
    const threadData = global.data?.threadData?.get(String(threadID)) || {};
    if (threadData.antiOut !== true) return;

    // ফিরে আসার চেষ্টা
    await new Promise(r => setTimeout(r, 2000)); // ২ সেকেন্ড delay
    await api.addUserToGroup(botID, threadID);

    const name = await getUserName(api, authorStr);
    await api.sendMessage(
      `⚠️ ${name} বটকে বের করার চেষ্টা করেছে!\n🔒 বট স্বয়ংক্রিয়ভাবে ফিরে এসেছে।`,
      threadID
    );
  } catch (err) {
    global.log?.error(`antiOut ত্রুটি: ${err.message}`);
  }
};

async function getUserName(api, uid) {
  try {
    const i = await api.getUserInfo(uid);
    return i?.[uid]?.name || uid;
  } catch { return uid; }
                           }
