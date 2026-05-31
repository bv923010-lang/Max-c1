"use strict";

module.exports = ({ api, models, Users, Threads, Currencies }) => {
  return async function handleCommand({ event }) {
    const { body = "", senderID, threadID, type } = event;
    if (!body || type === "message_unsend") return;

    // ✅ Crash-proof — কখনো undefined হবে না
    const PREFIX   = global.config?.PREFIX !== undefined ? global.config.PREFIX : "/";
    const botID    = global.config?.botID;
    const noPrefix = PREFIX === "" || PREFIX === null;

    if (senderID === botID) return;
    if (global.data?.userBanned?.has(String(senderID))) return;
    if (global.data?.threadBanned?.has(String(threadID))) return;

    const bodyTrim = body.trim();

    // ── PREFIX TRIGGERS (prefix ছাড়াই কাজ করে) ──────────
    const bodyLower = bodyTrim.toLowerCase();
    if (
      bodyLower === "prefix" ||
      bodyLower === "no prefix" ||
      bodyLower === "noprefix" ||
      bodyLower.startsWith("prefix +")
    ) {
      const prefixCmd = global.client.commands.get("prefix");
      if (prefixCmd) {
        const ctx = buildCtx({ api, event, args: bodyTrim.split(/\s+/).slice(1), models, Users, Threads, Currencies, PREFIX });
        try { await runCmd(prefixCmd, ctx); } catch (e) { global.log?.error(`prefix: ${e.message}`); }
      }
      return;
    }

    // ── PREFIX ENGINE ─────────────────────────────────────
    let commandName, args;

    if (noPrefix) {
      const parts = bodyTrim.split(/\s+/);
      commandName  = parts[0]?.toLowerCase();
      args         = parts.slice(1);
    } else {
      if (!bodyTrim.startsWith(PREFIX)) return;
      const withoutPrefix = bodyTrim.slice(PREFIX.length).trim();
      const parts = withoutPrefix.split(/\s+/);
      commandName  = parts[0]?.toLowerCase();
      args         = parts.slice(1);
    }

    if (!commandName) return;

    // ── COMMAND LOOKUP ────────────────────────────────────
    const cmd = global.client.commands.get(commandName)
             || [...global.client.commands.values()].find(c =>
                  c.config?.aliases?.map(a => a.toLowerCase()).includes(commandName)
                );
    if (!cmd) return;

    // Cooldown
    const now    = Date.now();
    const cdKey  = `${senderID}:${cmd.config.name}`;
    const cdSecs = cmd.config.cooldowns ?? cmd.config.countDown
                ?? cmd.config.coolDown  ?? global.config?.COOLDOWNS?.default ?? 3;
    if (global.client.cooldowns.has(cdKey)) {
      const expiry = global.client.cooldowns.get(cdKey);
      if (now < expiry) {
        const left = ((expiry - now) / 1000).toFixed(1);
        return api.sendMessage(`⏳ ${left} সেকেন্ড পর আবার ব্যবহার করুন।`, threadID);
      }
    }
    if (cdSecs > 0) global.client.cooldowns.set(cdKey, now + cdSecs * 1000);

    // Admin guard
    const role = cmd.config.role ?? cmd.config.hasPermssion ?? 0;
    if (role >= 1) {
      const admins = global.config?.ADMINBOT || [];
      if (!admins.includes(String(senderID)))
        return api.sendMessage("🔒 এই কমান্ডটি শুধুমাত্র অ্যাডমিনের জন্য।", threadID);
    }

    global.log?.cmd(`[${cmd.config.name}] → ${senderID} @ ${threadID}`);

    const ctx = buildCtx({ api, event, args, models, Users, Threads, Currencies, PREFIX });
    try { await runCmd(cmd, ctx); }
    catch (err) {
      global.log?.error(`[${cmd.config.name}] ত্রুটি: ${err.message}`);
      try { api.sendMessage(`❌ ${err.message?.slice(0, 150)}`, threadID); } catch {}
    }
  };
};

function buildCtx({ api, event, args, models, Users, Threads, Currencies, PREFIX }) {
  const { threadID, senderID, messageID } = event;
  // ✅ prefix এবং config দুটোই pass করা হচ্ছে — help.js সহ সব command কাজ করবে
  return {
    api, event, args, models, Users, Threads, Currencies,
    threadID, senderID, messageID,
    prefix: PREFIX,
    config: global.config || {},
    message: {
      reply:  (m) => api.sendMessage(m, threadID),
      send:   (m, tid) => api.sendMessage(m, tid || threadID),
      react:  (e) => api.setMessageReaction(e, messageID, () => {}, true),
      unsend: (m) => api.unsendMessage(m),
    },
  };
}

async function runCmd(cmd, ctx) {
  const runner = cmd.onStart || cmd.run || cmd.onCall;
  if (runner) return await runner(ctx);
  if (cmd._wrapped) return await cmd._wrapped(ctx);
        }
    
