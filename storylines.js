import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_KEY = process.argv[2];
if (!API_KEY) {
  console.error("Usage: node storylines.js <GEMINI_API_KEY>");
  process.exit(1);
}

const FILE_PATH = path.join(__dirname, "storylines.json");


const TODAY = new Date().toISOString().split("T")[0];
const THIRTY_DAYS_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

function geminiRequest(prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    });
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode !== 200) return reject(new Error(`Gemini ${res.statusCode}: ${data}`));
        const text = JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        resolve(text);
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function parseJson(text) {
  const stripped = text.replace(/```(?:json)?\n?/g, "").trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array in response:\n" + text.slice(0, 500));
  return JSON.parse(match[0]);
}

// Returns a set of team names (lowercase) for games within the live window:
// 1 hour before tip-off through 2 hours after tip-off
function getLiveTeams() {
  return new Promise((resolve) => {
    https.get(
      {
        hostname: "site.api.espn.com",
        path: "/apis/site/v2/sports/basketball/nba/scoreboard",
        headers: { "User-Agent": "Mozilla/5.0" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            const now = Date.now();
            const PRE_MS = 60 * 60 * 1000;      // 1 hour before tip-off
            const POST_MS = 2 * 60 * 60 * 1000; // 2 hours after tip-off
            const liveTeams = new Set();

            for (const event of json.events ?? []) {
              const tipoff = new Date(event.date).getTime();
              const inWindow = now >= tipoff - PRE_MS && now <= tipoff + POST_MS;
              if (inWindow) {
                for (const comp of event.competitions?.[0]?.competitors ?? []) {
                  liveTeams.add(comp.team.displayName.toLowerCase());
                  liveTeams.add(comp.team.shortDisplayName?.toLowerCase());
                  liveTeams.add(comp.team.abbreviation?.toLowerCase());
                }
              }
            }
            resolve(liveTeams);
          } catch {
            resolve(new Set());
          }
        });
      }
    ).on("error", () => resolve(new Set()));
  });
}

// Keywords per storyline that indicate which teams/topics to match against live games
const STORYLINE_KEYWORDS = [
  ["knicks", "new york"],
  ["spurs", "san antonio", "wembanyama", "wemby"],
  ["__any_playoff__"],
];

function isPlayoffSeason(liveTeams) {
  return liveTeams.size > 0;
}

function storylineIsLive(index, liveTeams) {
  if (liveTeams.size === 0) return false;
  const keywords = STORYLINE_KEYWORDS[index] ?? [];
  if (keywords.includes("__any_playoff__")) return isPlayoffSeason(liveTeams);
  return keywords.some((kw) => [...liveTeams].some((t) => t?.includes(kw)));
}

function buildPrompt(title, existingEvents) {
  const lastDate = existingEvents.length
    ? existingEvents[existingEvents.length - 1].date
    : "30 days ago";
  const existing = existingEvents.map((e) => `- [${e.date}] ${e.title}`).join("\n") || "none yet";

  return `You are building a dramatic, cinematic timeline for this NBA storyline: "${title}"

Today's date is ${TODAY}. Search Google thoroughly for REAL events that have occurred since ${lastDate} that built tension around this storyline.

Cast a WIDE net — include:
- On-court moments (big plays, ejections, injuries, controversies)
- Off-court drama (locker room issues, coach/player feuds, fines)
- Political figures attending games (e.g. presidents, politicians)
- Celebrity appearances that caused controversy
- Fan incidents, protests, or civil unrest connected to the games
- Social media controversies, viral moments
- Anything polarizing that the public is talking about

Events already in the timeline (do NOT repeat these):
${existing}

Return ONLY new events not already listed above. Return valid JSON array only, no markdown, no explanation. imageUrl must always be null:
[
  { "date": "YYYY-MM-DD", "title": "Short dramatic event title", "imageUrl": null }
]`;
}

async function main() {
  const storylines = JSON.parse(fs.readFileSync(FILE_PATH, "utf8"));

  console.log("Fetching new events and live status...");
  const liveTeams = await getLiveTeams();

  for (const [i, storyline] of storylines.entries()) {
    const prompt = buildPrompt(storyline.title, storyline.events);

    process.stdout.write(`  "${storyline.title.slice(0, 50)}"... `);
    const text = await geminiRequest(prompt);
    const newEvents = parseJson(text);

    storyline.events = [...storyline.events, ...newEvents];
    storyline.events.sort((a, b) => a.date.localeCompare(b.date));
    storyline.isLive = storylineIsLive(i, liveTeams);

    console.log(`+${newEvents.length} new events (${storyline.events.length} total)`);
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(storylines, null, 4));
  console.log("\nstorylines.json updated successfully.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
