/*
 * চাঁদের রানী — BELAL BOTX666 v9.0
 * ✅ SQLite permanent memory
 * ✅ Attached image → Catbox upload
 * ✅ 4x Groq + 4x Gemini + Pollinations
 * ✅ VoiceRSS TTS
 * Master: Belal YT | চাঁদের পাহাড় 🪬
 */
"use strict";

const axios  = require("axios");
const fs     = require("fs-extra");
const path   = require("path");

// ── SQLite setup ──────────────────────────────────────
let db = null;
function getDB() {
  if (db) return db;
  try {
    const Database = require("better-sqlite3");
    const dbPath   = path.join(process.cwd(), "includes", "rani_memory.sqlite");
    fs.ensureDirSync(path.dirname(dbPath));
    db = new Database(dbPath);
    db.exec(`
      CREATE TABLE IF NOT EXISTS memory (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        role      TEXT NOT NULL,
        content   TEXT NOT NULL,
        ts        INTEGER DEFAULT (strftime('%s','now'))
      );
      CREATE INDEX IF NOT EXISTS idx_thread ON memory(thread_id, sender_id);
    `);
    return db;
  } catch (e) {
    global.log?.warn(`SQLite: ${e.message}`);
    return null;
  }
}

function loadHistory(threadID, senderID, limit = 20) {
  try {
    const d = getDB();
    if (!d) return [];
    const rows = d.prepare(
      `SELECT role, content FROM memory
       WHERE thread_id=? AND sender_id=?
       ORDER BY ts DESC LIMIT ?`
    ).all(String(threadID), String(senderID), limit);
    return rows.reverse().map(r => ({ role: r.role, content: r.content }));
  } catch { return []; }
}

function saveMessage(threadID, senderID, role, content) {
  try {
    const d = getDB();
    if (!d) return;
    d.prepare(
      `INSERT INTO memory (thread_id, sender_id, role, content) VALUES (?,?,?,?)`
    ).run(String(threadID), String(senderID), role, content.slice(0, 2000));
    // পুরনো memory prune — per user max 100 rows
    d.prepare(
      `DELETE FROM memory WHERE thread_id=? AND sender_id=? AND id NOT IN
       (SELECT id FROM memory WHERE thread_id=? AND sender_id=? ORDER BY ts DESC LIMIT 100)`
    ).run(String(threadID), String(senderID), String(threadID), String(senderID));
  } catch {}
}

function clearHistory(threadID, senderID) {
  try {
    const d = getDB();
    if (!d) return;
    d.prepare(`DELETE FROM memory WHERE thread_id=? AND sender_id=?`)
     .run(String(threadID), String(senderID));
  } catch {}
}

// ── Constants ─────────────────────────────────────────
const MASTER_UIDS = ["61577502464880", "100056725134303"];

const RANI_TRIGGERS = [
  "bot","baby","বেবি","বেবি বট","রানী","rani",
  "চাঁদের রানী","chander rani","রানি",
];

const SYSTEM_PROMPT = `তুমি "চাঁদের রানী" 👑🌙 — BELAL BOTX666 বটের AI চরিত্র।
তোমাকে তৈরি করেছেন তোমার একমাত্র মাস্টার: Belal YT (চাঁদের পাহাড়) 🪬

তোমার পরিচয়: নাম চাঁদের রানী, মেয়ে, বুদ্ধিমান, আবেগী, মজাদার।
তুমি কখনো নিজেকে AI বা bot বলবে না।

মাস্টারের পরিচয়:
নাম: Belal YT | ডাকনাম: চাঁদের পাহাড় 🪬
Facebook: https://www.facebook.com/profile.php?id=61577502464880
WhatsApp: 01913246554 | Location: Kurigram, Bangladesh 🇧🇩

[MASTER=true] → মাস্টার। অন্য কাউকে মাস্টার বলবে না।

ব্যক্তিত্ব:
- স্বাভাবিক কথায় → সংক্ষিপ্ত, ইমোজি 😊💕😤😂🥺👑
- বড় কাজে → বিস্তারিত
- বেয়াদবি → রাগ 😤, মাস্টারকে বিচার দেওয়ার হুমকি
- "মালিক কে?" → "চাঁদের পাহাড় এবং Belal YT 👑🪬"

BELAL BOTX666 Bot Project Knowledge:
- Framework: Hybrid Mirai + GoatBot, Node.js
- Commands: module.exports.run অথবা onStart
- handleReply: { name:"cmd", messageID, author:senderID }
- Media: axios responseType:"stream" → r.data.path="file.jpg"
- File: arraybuffer → fs.writeFile → createReadStream → sendMessage
- Error "Cannot read PREFIX": global.config?.PREFIX || "/"
- Groq model: llama-3.3-70b-versatile
- Gemini model: gemini-1.5-flash
- tmp folder: path.join(process.cwd(),"tmp")
- Config keys: global.config.APIKEYS.GROQ/GEMINI/etc
- Secrets: GitHub Actions secrets inject করে config.json এ

সবসময় বাংলায় কথা বলো। 🌙👑`;

// ── Key helpers ───────────────────────────────────────
const getKeys = (names) => names
  .flatMap(n => [global.config?.APIKEYS?.[n], process.env[n]])
  .filter(k => k && k.length > 10 && !k.startsWith("YOUR_"));

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ══════════════════════════════════════════════════════
module.exports = {
  config: {
    name: "ai",
    aliases: ["চাঁদেররানী","রানী","রানি","rani","gpt","ask",
              "chat","gemini","groq","bot","baby","বেবি"],
    version: "9.0.0",
    author: "Belal YT — চাঁদের পাহাড়",
    countDown: 3,
    role: 0,
    hasPermssion: 0,
    shortDescription: "চাঁদের রানী 🌙",
    category: "🌙 AI",
    guide: { en: "{pn} <যা মনে চায়>" },
    dependencies: { "better-sqlite3": "*" },
  },

  onStart: async function (ctx) { return module.exports._handle(ctx); },
  run:     async function (ctx) { return module.exports._handle(ctx); },

  handleEvent: async function ({ api, event }) {
    if (event.type !== "message") return;
    const body   = (event.body || "").trim();
    const PREFIX = global.config?.PREFIX || "/";
    if (!body || (PREFIX && body.startsWith(PREFIX))) return;

    const lower     = body.toLowerCase();
    const triggered = RANI_TRIGGERS.some(t => lower === t || lower.startsWith(t + " "));
    if (!triggered) return;

    let query = body;
    for (const t of RANI_TRIGGERS) {
      if (lower.startsWith(t + " ")) { query = body.slice(t.length).trim(); break; }
      else if (lower === t) { query = ""; break; }
    }
    await module.exports._handle({ api, event: { ...event, body: query || body }, prefix: PREFIX });
  },

  handleReply: async function ({ api, event, handleReply }) {
    if (event.senderID !== handleReply.author) return;
    const body = (event.body || "").trim();
    if (!body) return;
    await module.exports._handle({ api, event: { ...event, body }, prefix: global.config?.PREFIX || "/" });
  },

  _handle: async function ({ api, event, prefix }) {
    const { threadID, senderID, body, messageID } = event;
    const pfx      = prefix || global.config?.PREFIX || "/";
    const isMaster = MASTER_UIDS.includes(String(senderID));

    const query = (body || "")
      .replace(/^\/(ai|gpt|ask|chat|gemini|groq|রানী|রানি|rani|bot|baby|বেবি|চাঁদেররানী)\s*/i, "")
      .trim();

    // Memory clear command
    if (/^(memory clear|ভুলে যাও|সব ভুলো)$/i.test(query)) {
      clearHistory(threadID, senderID);
      return api.sendMessage("🧹 সব কথোপকথন মুছে দিলাম 💕", threadID);
    }

    if (!query) return api.sendMessage(
      `🌙 ${isMaster ? "স্বাগতম মাস্টার! 💕" : "হ্যালো! আমি চাঁদের রানী 👑"}\n` +
      `যা মনে চায় বলো ✨\nব্যবহার: ${pfx}ai <তোমার কথা>`,
      threadID
    );

    // ── Attached image → Catbox upload ──────────────────
    const hasAttachment = event.attachments?.length > 0
                       || event.messageReply?.attachments?.length > 0;
    const attachments   = event.attachments || event.messageReply?.attachments || [];

    if (hasAttachment && /catbox|imgur|লিংক|upload|আপলোড/i.test(query)) {
      return module.exports._uploadFiles(api, event, attachments);
    }

    // Image generation
    if (/ছবি.*বানাও|ছবি.*তৈরি|image.*generat|draw|আঁকো/i.test(query)) {
      return module.exports._generateImage(api, event, query);
    }

    // Voice request
    const wantsVoice = /ভয়েস|voice|কণ্ঠে|শুনতে চাই/i.test(query);

    try { api.setMessageReaction("🌙", messageID, () => {}, true); } catch {}

    // Load history from SQLite
    const hist = loadHistory(threadID, senderID);
    const userContent = isMaster ? `[MASTER=true] ${query}` : query;
    hist.push({ role: "user", content: userContent });

    let response = null;

    // ── Groq ──────────────────────────────────────────
    const groqKeys = getKeys(["GROQ","GROQ2","GROQ3","GROQ4",
                               "GROQ_KEY","GROQ_KEY2","GROQ_KEY3","GROQ_KEY4"]);
    for (let i = 0; i < 2 && !response; i++) {
      const k = pick(groqKeys);
      if (!k) break;
      try {
        const r = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: SYSTEM_PROMPT }, ...hist.slice(-20)],
            max_tokens: 2000, temperature: 0.88,
          },
          { headers: { Authorization: `Bearer ${k}`, "Content-Type": "application/json" }, timeout: 25000 }
        );
        response = r.data?.choices?.[0]?.message?.content?.trim();
      } catch (e) { global.log?.warn(`Groq: ${e.message?.slice(0,60)}`); }
    }

    // ── Gemini ─────────────────────────────────────────
    if (!response) {
      const gemKeys = getKeys(["GEMINI","GEMINI2","GEMINI3","GEMINI4",
                                "GEMINI_KEY","GEMINI_KEY2","GEMINI_KEY3","GEMINI_KEY4"]);
      for (let i = 0; i < 2 && !response; i++) {
        const k = pick(gemKeys);
        if (!k) break;
        try {
          const r = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${k}`,
            {
              systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
              contents: hist.slice(-10).map(h => ({
                role: h.role === "assistant" ? "model" : "user",
                parts: [{ text: h.content }],
              })),
              generationConfig: { maxOutputTokens: 2000, temperature: 0.88 },
            },
            { timeout: 25000 }
          );
          response = r.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        } catch (e) { global.log?.warn(`Gemini: ${e.message?.slice(0,60)}`); }
      }
    }

    // ── Pollinations fallback ──────────────────────────
    if (!response) {
      try {
        const p = encodeURIComponent(`${SYSTEM_PROMPT.slice(0,200)}\nUser: ${query}`);
        const r = await axios.get(`https://text.pollinations.ai/${p}`, { timeout: 20000 });
        response = (typeof r.data === "string" ? r.data : JSON.stringify(r.data))?.trim();
      } catch {}
    }

    try { api.setMessageReaction(response ? "✅" : "❌", messageID, () => {}, true); } catch {}

    if (!response) return api.sendMessage(
      isMaster ? `🥺 মাস্টার, সব API ব্যস্ত... একটু পর চেষ্টা করুন 💕`
               : `🥺 একটু সমস্যা... একটু পর আবার বলো 💕`, threadID
    );

    // Save to SQLite
    saveMessage(threadID, senderID, "user", userContent);
    saveMessage(threadID, senderID, "assistant", response);

    if (wantsVoice) return module.exports._sendVoice(api, threadID, messageID, response);

    api.sendMessage(response, threadID, (err, info) => {
      if (err || !info?.messageID) return;
      global.client.handleReply.push({ name: "ai", messageID: info.messageID, author: senderID });
    });
  },

  // ── Catbox upload ─────────────────────────────────────
  _uploadFiles: async function (api, event, attachments) {
    const { threadID, messageID } = event;
    try {
      api.setMessageReaction("📦", messageID, () => {}, true);
      const tmpDir = path.join(process.cwd(), "tmp");
      await fs.ensureDir(tmpDir);
      let msg = "📦 Upload Results:\n";

      for (const att of attachments.slice(0, 3)) {
        const url  = att.url || att.playbackUrl;
        if (!url) continue;
        const ext  = att.type === "photo" ? "jpg" : att.type === "video" ? "mp4"
                   : att.type === "audio" ? "mp3" : "dat";
        const file = path.join(tmpDir, `upload_${Date.now()}.${ext}`);

        try {
          const buf = (await axios.get(url, { responseType: "arraybuffer", timeout: 30000 })).data;
          await fs.writeFile(file, Buffer.from(buf));

          const FormData = require("form-data");
          const form     = new FormData();
          form.append("reqtype", "fileupload");
          form.append("fileToUpload", fs.createReadStream(file));

          const res = await axios.post("https://catbox.moe/user/api.php", form,
            { headers: form.getHeaders(), timeout: 60000 });
          msg += `✅ ${res.data.trim()}\n`;
        } catch (e) {
          msg += `❌ Failed: ${e.message?.slice(0,50)}\n`;
        } finally {
          await fs.remove(file).catch(() => {});
        }
      }

      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage(msg.trim(), threadID, messageID);
    } catch (e) {
      api.sendMessage(`❌ Upload ব্যর্থ: ${e.message?.slice(0,80)}`, threadID, messageID);
    }
  },

  // ── Image generation ──────────────────────────────────
  _generateImage: async function (api, event, prompt) {
    const { threadID, messageID } = event;
    try {
      api.setMessageReaction("🎨", messageID, () => {}, true);
      const clean = prompt.replace(/ছবি.*বানাও|ছবি.*তৈরি/g, "").trim() || "beautiful art";
      const url   = `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=512&height=512&nologo=true`;
      const r     = await axios.get(url, { responseType: "stream", timeout: 35000 });
      r.data.path = "rani_art.jpg";
      api.setMessageReaction("✅", messageID, () => {}, true);
      api.sendMessage({ body: `🎨 ছবি তৈরি হলো ✨`, attachment: r.data }, threadID, messageID);
    } catch {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ ছবি তৈরি করতে পারিনি 🥺", threadID, messageID);
    }
  },

  // ── VoiceRSS TTS ──────────────────────────────────────
  _sendVoice: async function (api, threadID, messageID, text) {
    const vKey   = global.config?.APIKEYS?.VOICERSS || process.env.VOICERSS_KEY;
    const tmpDir = path.join(process.cwd(), "tmp");
    await fs.ensureDir(tmpDir);
    const file   = path.join(tmpDir, `voice_${Date.now()}.mp3`);
    try {
      if (!vKey) throw new Error("No VoiceRSS key");
      const clean = text.replace(/[*_~`#\[\]]/g, "").slice(0, 500);
      const url   = `https://api.voicerss.org/?key=${vKey}&hl=bn-BD&v=Pita&src=${encodeURIComponent(clean)}&f=48khz_16bit_stereo&c=MP3`;
      const r     = await axios.get(url, { responseType: "arraybuffer", timeout: 20000 });
      const first = Buffer.from(r.data.slice(0, 20)).toString("utf8");
      if (first.includes("ERROR")) throw new Error(first);
      await fs.writeFile(file, Buffer.from(r.data));
      await api.sendMessage(
        { body: "🎙️ চাঁদের রানীর কণ্ঠ 🌙", attachment: fs.createReadStream(file) },
        threadID, () => fs.remove(file).catch(() => {}), messageID
      );
    } catch (e) {
      global.log?.warn(`Voice: ${e.message}`);
      api.sendMessage(`🎙️ *(voice unavailable)*\n\n${text}`, threadID, messageID);
      await fs.remove(file).catch(() => {});
    }
  },
};
                                  
