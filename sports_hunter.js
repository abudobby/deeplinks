import puppeteer from 'puppeteer';
import fs from 'fs';

const API_URL = 'https://sportyhunter.com/api/get-discovery-matches';
const BASE_URL = 'https://sportyhunter.com/match/';

console.log('Fetching matches from API...');

const res = await fetch(API_URL);
const data = await res.json();

const bundesligaMatches = data.matches.filter(match => match.league === 'Bundesliga');

console.log(`Found ${data.matches.length} total matches, ${bundesligaMatches.length} Bundesliga`);

if (bundesligaMatches.length === 0) {
  console.log('No Bundesliga matches found.');
  process.exit(0);
}

const browser = await puppeteer.launch({ headless: true });
const results = [];

for (const match of bundesligaMatches) {
  const slug = match.slug;
  const matchUrl = `${BASE_URL}${slug}`;
  const label = `${match.team1} vs ${match.team2}`;
  console.log(`\n⚽ ${label}`);
  console.log(`   URL: ${matchUrl}`);

  let m3u8Found = null;

  try {
    const page = await browser.newPage();
    const m3u8Urls = new Set();

    const capture = (url) => {
      if (url.includes('.m3u8') && !m3u8Urls.has(url)) {
        m3u8Urls.add(url);
        console.log(`   ✅ Found stream: ${url}`);
      }
    };

    page.on('request', (req) => capture(req.url()));

    browser.on('targetcreated', async (target) => {
      const newPage = await target.page();
      if (newPage) newPage.on('request', (req) => capture(req.url()));
    });

    await page.goto(matchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    const frames = page.frames();
    for (const frame of frames) {
      frame.on('request', (req) => capture(req.url()));
    }

    for (const frame of frames) {
      try { await frame.click('video'); } catch {}
      try { await frame.click('.play-button, .vjs-big-play-button, .ytp-play-button, [aria-label="Play"]'); } catch {}
    }

    // ⏱️ Wait up to 4 seconds for stream to appear, then skip
    await Promise.race([
      new Promise(r => setTimeout(r, 4000)),
      new Promise(r => {
        const interval = setInterval(() => {
          if (m3u8Urls.size > 0) { clearInterval(interval); r(); }
        }, 100);
      })
    ]);

    if (m3u8Urls.size === 0) {
      console.log(`   ⏭️  No stream after 4s, skipping...`);
    }

    m3u8Found = [...m3u8Urls][0] || null;
    await page.close();

  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }

  results.push({ slug, label, matchUrl, league: match.league, m3u8: m3u8Found });
}

await browser.close();

let playlist = '#EXTM3U\n\n';
let count = 0;

for (const { label, matchUrl, league, m3u8 } of results) {
  if (!m3u8) continue;
  count++;
  playlist += `#EXTINF:-1 tvg-name="${label}" group-title="${league}",${label}\n`;
  playlist += `#EXTVLCOPT:http-referrer=${matchUrl}\n`;
  playlist += `#EXTVLCOPT:http-origin=https://sportyhunter.com\n`;
  playlist += `#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15\n`;
  playlist += `${m3u8}\n\n`;
}

fs.writeFileSync('streams.m3u8', playlist);
console.log(`\n✅ Done! ${count} streams written to streams.m3u8`);