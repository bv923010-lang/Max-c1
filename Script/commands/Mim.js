"use strict";
const axios = require("axios");

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://imgur.com/",
  "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
};

async function fastStream(links) {
  const pick = () => links[Math.floor(Math.random() * links.length)];
  const attempts = [pick(), pick(), pick()];
  const streams = attempts.map(url =>
    axios({ method: "GET", url, responseType: "stream", headers: HEADERS, timeout: 15000, maxRedirects: 5 })
      .then(r => { r.data.path = "mim.jpg"; return r.data; })
  );
  return Promise.any(streams);
}

module.exports.config = {
  name: "mim",
  version: "3.1.0",
  hasPermssion: 0,
  author: "Belal YT",
  description: "র‍্যান্ডম মিম ছবি ULTRA FAST",
  category: "🎭 ফান",
  usage: "/mim",
  cooldowns: 2,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;
  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);

    const imgLinks = [
      "https://i.imgur.com/riMo2q4.jpeg",
      "https://i.imgur.com/EsVSDvf.jpeg",
      "https://i.imgur.com/J43TM5C.jpeg",
      "https://i.imgur.com/npq0cee.jpeg",
      "https://i.imgur.com/znUMJVO.jpeg",
      "https://i.imgur.com/xlo4Xy1.jpeg",
      "https://i.imgur.com/nwEJjwP.jpeg",
      "https://i.imgur.com/d5JpOzR.jpeg",
      "https://i.imgur.com/S4k2kla.jpeg",
      "https://i.imgur.com/xUNa273.jpeg",
      "https://i.imgur.com/pxoN4tm.jpeg",
      "https://i.imgur.com/SyLrp1O.jpeg",
      "https://i.imgur.com/f04Rn08.jpeg",
      "https://i.imgur.com/dOfPbYi.jpeg",
      "https://i.imgur.com/J5lEZKs.jpeg",
      "https://i.imgur.com/gV5oB0u.jpeg",
      "https://i.imgur.com/ePDk1np.jpeg",
      "https://i.imgur.com/65rrnVu.jpeg",
      "https://i.imgur.com/YnYatW6.jpeg",
      "https://i.imgur.com/x0Lr711.jpeg",
      "https://i.imgur.com/ekVzPSx.jpeg",
      "https://i.imgur.com/C4my9E6.jpeg",
      "https://i.imgur.com/kN8lLqV.jpeg",
      "https://i.imgur.com/SfnuV9c.jpeg",
      "https://i.imgur.com/gaP7l3I.jpeg",
      "https://i.imgur.com/K3Rjjz5.jpeg",
      "https://i.imgur.com/uUMBUUT.jpeg",
      "https://i.imgur.com/6g3s1P6.jpeg",
      "https://i.imgur.com/BQ71z6G.jpeg",
      "https://i.imgur.com/gfIQXv2.jpeg",
      "https://i.imgur.com/lB1V7zJ.jpeg",
      "https://i.imgur.com/t0OaRua.jpeg",
      "https://i.imgur.com/mZROUP1.jpeg",
      "https://i.imgur.com/b63GBQf.jpeg",
      "https://i.imgur.com/TKn3ZNY.jpeg",
      "https://i.imgur.com/fn8SK8I.jpeg",
      "https://i.imgur.com/PTZJ380.jpeg",
      "https://i.imgur.com/n91hYXu.jpeg",
      "https://i.imgur.com/dhLuB8l.jpeg",
      "https://i.imgur.com/RE7S75s.jpeg",
      "https://i.imgur.com/dh78LXh.jpeg",
      "https://i.imgur.com/tqEZ2bA.jpeg",
      "https://i.imgur.com/HMg2RbK.jpeg",
      "https://i.imgur.com/ZfW3i1A.jpeg",
      "https://i.imgur.com/9eVXqBI.jpeg",
      "https://i.imgur.com/7NcbhSX.jpeg",
      "https://i.imgur.com/y3KWpkn.jpeg",
      "https://i.imgur.com/uNBslcr.jpeg",
      "https://i.imgur.com/95fnfl2.jpeg",
      "https://i.imgur.com/i4uJDhJ.jpeg",
    ];

    const stream = await fastStream(imgLinks);
    await api.sendMessage(
      { body: "┄┉❈✡️⋆⃝চাঁদেড়~পাহাড়✿⃝🪬❈┉┄", attachment: stream },
      threadID, messageID
    );
    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch {
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage("❌ ছবি আনতে ব্যর্থ, আবার চেষ্টা করুন।", threadID, messageID);
  }
};

module.exports.onStart = module.exports.run;
  
