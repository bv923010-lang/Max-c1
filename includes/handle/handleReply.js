/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📩 handleReply.js
  BELAL BOTX666 | Master: Belal YT

  🔧 BUG FIX:
  1. "name" ও "commandName" দুটোই সাপোর্ট (GoatBot+Mirai)
  2. author check: reply করছে ঠিক সেই ব্যক্তি কিনা
  3. persistReply: true হলে একাধিকবার reply নিতে পারবে
  4. Bot নিজে reply করলে ignore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    if (event.type !== "message_reply") return;
    const { messageReply, senderID } = event;
    if (!messageReply?.messageID) return;

    // বট নিজে reply করলে ignore
    const botID = global.config?.botID || api.getCurrentUserID?.();
    if (botID && String(senderID) === String(botID)) return;

    const handleReply = global.client.handleReply;
    if (!handleReply?.length) return;

    for (let i = handleReply.length - 1; i >= 0; i--) {
      const handler = handleReply[i];

      // ✅ FIX: messageID match করো
      if (handler.messageID !== messageReply.messageID) continue;

      // ✅ FIX: author check — reply করছে ঠিক সে কিনা
      if (handler.author && String(senderID) !== String(handler.author)) continue;

      // ✅ FIX: commandName বা name যেটাই থাকুক
      const cmdName = handler.commandName || handler.name;
      if (!cmdName) continue;

      const cmd = global.client.commands.get(cmdName);
      if (!cmd?.handleReply) continue;

      // one-shot: persistReply না থাকলে use করার পর সরাও
      if (!handler.persistReply) handleReply.splice(i, 1);

      try {
        await cmd.handleReply({
          api, event, models, Users, Threads, Currencies,
          handleReply: handler,
          Reply: handler,   // কিছু command "Reply" নামে expect করে
          ...handler,
        });
      } catch (err) {
        global.log?.error(`handleReply [${cmdName}] ত্রুটি: ${err.message}`);
      }
      break;
    }
  };
};
