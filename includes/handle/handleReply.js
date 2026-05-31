"use strict";

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    if (event.type !== "message_reply") return;
    const { messageReply } = event;
    if (!messageReply) return;

    const handleReply = global.client.handleReply;

    for (let i = handleReply.length - 1; i >= 0; i--) {
      const handler = handleReply[i];
      if (handler.messageID !== messageReply.messageID) continue;

      // ✅ "name" (GoatBot) এবং "commandName" (Mirai) দুটোই সাপোর্ট
      const cmdName = handler.commandName || handler.name;
      if (!cmdName) continue;

      const cmd = global.client.commands.get(cmdName);
      if (!cmd?.handleReply) continue;

      // one-shot: use করার পর remove
      if (!handler.persistReply) handleReply.splice(i, 1);

      try {
        await cmd.handleReply({
          api, event, models, Users, Threads, Currencies,
          handleReply: handler, // GoatBot style
          ...handler,           // spread for direct access
        });
      } catch (err) {
        global.log.error(`handleReply [${cmdName}] ত্রুটি: ${err.message}`);
      }
      break;
    }
  };
};
