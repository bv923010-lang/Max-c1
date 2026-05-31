"use strict";

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    const { events, eventRegistered, commands } = global.client;

    // ✅ Crash-proof
    if (!events || !commands) return;

    // ── Event handlers ───────────────────────────────────
    for (const [name, evt] of events) {
      if (global.config?.EVENT_DISABLED?.includes(name)) continue;
      try {
        await evt.handleEvent({ api, event, models, Users, Threads, Currencies });
      } catch (err) {
        global.log?.error(`ইভেন্ট [${name}] ত্রুটি: ${err.message}`);
      }
    }

    // ── Command handleEvent ──────────────────────────────
    for (const name of (eventRegistered || [])) {
      const cmd = commands.get(name);
      if (!cmd?.handleEvent) continue;
      try {
        await cmd.handleEvent({ api, event, models, Users, Threads, Currencies });
      } catch (err) {
        global.log?.error(`Command Event [${name}] ত্রুটি: ${err.message}`);
      }
    }
  };
};
