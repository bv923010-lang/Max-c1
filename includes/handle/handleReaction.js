"use strict";
module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    const { handleReaction } = global.client;
    const { reaction, userID, messageID } = event;

    // react দিয়ে unsend
    const reactUnsend = global.config.BOT_MODES?.reactUnsend || ["😡","🤧","😤","😠"];
    if (reactUnsend.includes(reaction) && userID === api.getCurrentUserID()) {
      try { api.unsendMessage(messageID); } catch {}
      return;
    }

    // handleReaction queue
    for (const handler of handleReaction) {
      if (handler.messageID !== messageID) continue;
      try {
        const cmd = global.client.commands.get(handler.commandName);
        if (cmd?.handleReaction)
          await cmd.handleReaction({ api, event, models, Users, Threads, Currencies, ...handler });
      } catch (err) {
        global.log.error(`Reaction handler ত্রুটি: ${err.message}`);
      }
    }
  };
};
