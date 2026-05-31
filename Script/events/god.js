/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📡 god.js — গালি ও অসদাচরণ রোধ
  BELAL BOTX666 | Master: Belal YT

  🔧 BUG FIX:
  - SECURITY.godEnabled চেক সঠিকভাবে হচ্ছে
  - event.type চেক আগেই করা হচ্ছে
  - ADMINBOT undefined হলে crash হবে না
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

const BAD_WORDS = [
  "মাদারচোদ","মাগি","বেশ্যা","খানকি","চুদ","চোদ","হারামজাদা",
  "কুত্তার বাচ্চা","শুয়োরের বাচ্চা","ছাগলের বাচ্চা",
  "fuck","shit","bitch","asshole","bastard","motherfucker",
];

module.exports.config = {
  name: "god",
  eventType: ["message"],
  version: "3.0.0",
  description: "গালিগালাজ সনাক্ত করে অ্যাডমিনকে জানায়",
};

module.exports.handleEvent = async function ({ api, event }) {
  try {
    if (event.type !== "message") return;
    const { body, senderID, threadID } = event;
    if (!body) return;

    // ✅ FIX: optional chaining দিয়ে crash রোধ
    if (!global.config?.SECURITY?.godEnabled) return;
    const admins = global.config?.ADMINBOT || [];
    if (admins.includes(String(senderID))) return;

    const lowerBody = body.toLowerCase();
    const foundWord = BAD_WORDS.find(w => lowerBody.includes(w.toLowerCase()));
    if (!foundWord) return;

    const userName   = await getUserName(api, senderID);
    const threadInfo = await api.getThreadInfo(threadID).catch(() => null);
    const threadName = threadInfo?.name || "গ্রুপ";

    const warnMsg =
      `🚨 সতর্কতা!\n👤 ${userName} অসদাচরণ করেছে!\n` +
      `💬 মেসেজ: "${body.slice(0, 80)}"\n` +
      `🏠 গ্রুপ: ${threadName}\n` +
      `🆔 Thread: ${threadID}\n` +
      `📅 ${new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" })}`;

    for (const adminID of admins) {
      api.sendMessage(warnMsg, adminID, () => {});
    }

    api.sendMessage(
      `⚠️ ${userName}, অনুগ্রহ করে সদাচরণ বজায় রাখুন।\n❌ এই ধরনের ভাষা নিষিদ্ধ।`,
      threadID
    );
  } catch (err) {
    global.log?.error(`god ত্রুটি: ${err.message}`);
  }
};

async function getUserName(api, uid) {
  try {
    const i = await api.getUserInfo(uid);
    return i?.[uid]?.name || uid;
  } catch { return uid; }
}
