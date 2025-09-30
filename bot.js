import fs from "fs";
import fetch from "node-fetch";

const token = process.env.DISCORD_BOT_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

let state = {};
try {
  state = JSON.parse(fs.readFileSync(".state.json", "utf8"));
} catch {}

// 全サーバーの全チャンネルを取得
const getAllChannels = async () => {
  const guilds = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bot ${token}` },
  }).then((r) => r.json());

  const channels = [];
  for (const guild of guilds) {
    const guildChannels = await fetch(
      `https://discord.com/api/v10/guilds/${guild.id}/channels`,
      { headers: { Authorization: `Bot ${token}` } }
    ).then((r) => r.json());

    // テキストチャンネルのみ (type: 0=GUILD_TEXT, 5=GUILD_NEWS)
    channels.push(
      ...guildChannels
        .filter((ch) => ch.type === 0 || ch.type === 5)
        .map((ch) => ch.id)
    );
  }
  return channels;
};

const channels = await getAllChannels();
console.log(`Monitoring ${channels.length} channels`);

const askGemini = async (msg) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `次の文章に最も合う絵文字を1つだけ返してください（絵文字のみ、説明不要）: ${msg}`,
              },
            ],
          },
        ],
      }),
    }
  );
  const j = await res.json();
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "✅";
};

for (const ch of channels) {
  const last = state[ch];
  let url = `https://discord.com/api/v10/channels/${ch}/messages?limit=5`;
  if (last) url += `&after=${last}`;

  const msgs = await fetch(url, {
    headers: { Authorization: `Bot ${token}` },
  }).then((r) => r.json());

  if (!Array.isArray(msgs)) {
    console.log(`Channel ${ch}: No messages or error`);
    continue;
  }

  for (const m of msgs.reverse()) {
    if (m.author.bot) continue;

    console.log(`Processing: ${m.content.slice(0, 50)}...`);
    const emoji = await askGemini(m.content);
    console.log(`Emoji: ${emoji}`);

    const e = encodeURIComponent(emoji);
    await fetch(
      `https://discord.com/api/v10/channels/${ch}/messages/${m.id}/reactions/${e}/@me`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${token}` },
      }
    );

    state[ch] = m.id;
  }
}

fs.writeFileSync(".state.json", JSON.stringify(state, null, 2));
console.log("Done!");