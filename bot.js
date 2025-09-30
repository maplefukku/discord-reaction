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
  try {
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
                  text: `以下のメッセージの内容や感情を分析して、最も適切な絵文字を1つだけ選んでください。

ルール:
- 絵文字1つだけを返す（説明や文字は不要）
- メッセージの感情（嬉しい、悲しい、怒り、驚き等）を考慮
- メッセージの内容（食べ物、動物、イベント等）を考慮
- 日本語の文脈を理解して適切な絵文字を選ぶ
- 汎用的な✅や👍ではなく、具体的で内容に沿った絵文字を選ぶ

メッセージ: ${msg}

絵文字:`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 10,
          },
        }),
      }
    );
    const j = await res.json();

    if (j.error) {
      console.error("Gemini API Error:", j.error);
      return "❓";
    }

    const text = j.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return "❓";

    // 絵文字以外の文字を除去
    const emojiOnly = text.match(/[\p{Emoji}]/gu)?.[0];
    return emojiOnly || "❓";
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    return "❓";
  }
};

// 24時間前のタイムスタンプ（ミリ秒）
const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

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
    // フィルター1: Botのメッセージはスキップ（最速）
    if (m.author.bot) continue;

    // フィルター2: 既にリアクション済みかチェック（2番目に速い）
    if (m.reactions?.some((r) => r.me)) {
      console.log(`Already reacted: ${m.content?.slice(0, 50) || "[no content]"}...`);
      state[ch] = m.id;
      continue;
    }

    // フィルター3: 24時間以内のメッセージかチェック（Date生成コストあり）
    if (Date.parse(m.timestamp) < twentyFourHoursAgo) {
      console.log(`Old message: ${m.timestamp}`);
      continue;
    }

    // フィルター4: 空メッセージはスキップ（Gemini API節約）
    if (!m.content || m.content.trim().length === 0) {
      console.log(`Empty message, skipping`);
      state[ch] = m.id;
      continue;
    }

    // ここまで来たメッセージのみGemini API呼び出し（最も高コスト）
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