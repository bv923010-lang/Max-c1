/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚡ handleCommand.js — কমান্ড ইঞ্জিন
  BELAL BOTX666 | Master: Belal YT

  🔧 BUG FIX v2:
  1. noPrefix mode → PREFIX="" হলে সব কমান্ড কাজ করে
  2. PREFIX="/" হলে prefix ছাড়া কোনো কমান্ড নেবে না
  3. alias lookup case-insensitive করা হয়েছে
  4. cooldown key fixed (name based, alias safe)
  5. "prefix" keyword সবসময় কাজ করে (prefix ছাড়াও)
  6. বট নিজের মেসেজে respond করবে না (double-check)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
"use strict";

module.exports = ({ api, models, Users, Threads, Currencies }) => {
  return async function handleCommand({ event }) {
    const { body = "", senderID, threadID, type } = event;
    if (!body || !body.trim()) return;
    if (type === "message_unsend") return;

    // ── Bot নিজের মেসেজ ignore ──────────────────────────
    const botID  = global.config?.botID || api.getCurrentUserID?.();
    if (senderID === botID) return;

    // ── Ban check ────────────────────────────────────────
    if (global.data?.userBanned?.has(String(senderID))) return;
    if (global.data?.threadBanned?.has(String(threadID))) return;

    const PREFIX  = global.config?.PREFIX ?? "/";
    const noPrefix = PREFIX === "" || PREFIX === null;
    const bodyTrim = body.trim();
    const bodyLow  = bodyTrim.toLowerCase();

    // ── "prefix" keyword — সবসময় কাজ করে ──────────────
    if (
      bodyLow === "prefix" ||
      bodyLow === "no prefix" ||
      bodyLow === "noprefix" ||
      bodyLow.startsWith("prefix +")
    ) {
      const prefixCmd = global.client.commands.get("prefix");
      if (prefixCmd) {
        const ctx = buildCtx({ api, event, args: bodyTrim.split(/\s+/).slice(1), models, Users, Threads, Currencies, PREFIX });
        try { await runCmd(prefixCmd, ctx); } catch (e) { global.log?.error(`prefix: ${e.message}`); }
      }
      return;
    }

    // ── PREFIX ENGINE ────────────────────────────────────
    let commandName, args;

    if (noPrefix) {
      // No-prefix mode: সব কিছুই কমান্ড হিসেবে চেষ্টা করবে
      const parts = bodyTrim.split(/\s+/);
      commandName  = parts[0]?.toLowerCase();
      args         = parts.slice(1);
    } else {
      // Prefix mode: prefix ছাড়া কমান্ড নেবে না
      if (!bodyTrim.startsWith(PREFIX)) return;
      const withoutPrefix = bodyTrim.slice(PREFIX.length).trim();
      if (!withoutPrefix) return;
      const parts = withoutPrefix.split(/\s+/);
      commandName  = parts[0]?.toLowerCase();
      args         = parts.slice(1);
    }

    if (!commandName) return;

    // ── COMMAND LOOKUP — name + alias (case-insensitive) ─
    let cmd = global.client.commands.get(commandName);
    if (!cmd) {
      for (const [, c] of global.client.commands) {
        const aliases = (c.config?.aliases || []).map(a => a.toLowerCase());
        if (aliases.includes(commandName)) { cmd = c; break; }
      }
    }
    if (!cmd) return;

    // ── COOLDOWN ─────────────────────────────────────────
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

    // ── ADMIN GUARD ───────────────────────────────────────
    const role = cmd.config.role ?? cmd.config.hasPermssion ?? 0;
    if (role >= 1) {
      const admins = [...(global.config?.ADMINBOT || []), ...(global.config?.NDH || [])];
      if (!admins.includes(String(senderID)))
        return api.sendMessage("🔒 এই কমান্ডটি শুধুমাত্র অ্যাডমিনের জন্য।", threadID);
    }

    global.log?.cmd(`[${cmd.config.name}] → ${senderID} @ ${threadID}`);

    const ctx = buildCtx({ api, event, args, models, Users, Threads, Currencies, PREFIX });
    try {
      await runCmd(cmd, ctx);
    } catch (err) {
      global.log?.error(`[${cmd.config.name}] ত্রুটি: ${err.message}`);
      try { api.sendMessage(`❌ ${err.message?.slice(0, 150)}`, threadID); } catch {}
    }
  };
};

function buildCtx({ api, event, args, models, Users, Threads, Currencies, PREFIX }) {
  const { threadID, senderID, messageID } = event;
  return {
    api, event, args, models, Users, Threads, Currencies,
    threadID, senderID, messageID,
    prefix: PREFIX,
    config: global.config || {},
    message: {
      reply:  (m)       => api.sendMessage(m, threadID),
      send:   (m, tid)  => api.sendMessage(m, tid || threadID),
      react:  (e)       => api.setMessageReaction(e, messageID, () => {}, true),
      unsend: (m)       => api.unsendMessage(m),
    },
  };
}

async function runCmd(cmd, ctx) {
  const runner = cmd.onStart || cmd.run || cmd.onCall;
  if (runner) return await runner(ctx);
  if (cmd._wrapped) return await cmd._wrapped(ctx);
      }
      
