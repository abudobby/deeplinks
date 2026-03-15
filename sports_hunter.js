import puppeteer from 'puppeteer';
import fs from 'fs';

const URL = 'https://crackstreams.ms/league/nbaregular';

console.log(`Scraping hrefs from ${URL}...\n`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });

const hrefs = await page.evaluate(() => {
  // Get the first h2 (today's games section)
  const firstH2 = document.querySelector('h2');
  if (!firstH2) return [];

  // Collect all <a> links between the first h2 and the next h2
  const links = [];
  let el = firstH2.nextElementSibling;
  while (el && el.tagName !== 'H2') {
    for (const a of el.querySelectorAll('a[href]')) {
      links.push({
        text: a.textContent.trim().replace(/\s+/g, ' '),
        href: a.href,
      });
    }
    // Also check if el itself is a link
    if (el.tagName === 'A' && el.href) {
      links.push({
        text: el.textContent.trim().replace(/\s+/g, ' '),
        href: el.href,
      });
    }
    el = el.nextElementSibling;
  }
  return links;
});

// Don't close browser yet — we need it for stream hunting
await page.close();

// Filter to only stream links (game links)
const streamLinks = hrefs.filter(h => h.href.includes('/stream/'));

console.log(`Found ${streamLinks.length} NBA game links. Hunting for streams...\n`);

const results = [];

for (const link of streamLinks) {
  console.log(`🏀 ${link.text}`);
  console.log(`   ${link.href}`);

  let m3u8Found = null;

  try {
    const gamePage = await browser.newPage();
    const m3u8Urls = new Set();

    // Listen for .m3u8 requests on the main page
    const capture = (url) => {
      if (url.includes('.m3u8') && !m3u8Urls.has(url)) {
        m3u8Urls.add(url);
        console.log(`   ✅ Found stream: ${url}`);
      }
    };

    gamePage.on('request', (req) => capture(req.url()));

    // Listen for new tabs/popups
    const targetHandler = async (target) => {
      const newPage = await target.page();
      if (newPage) newPage.on('request', (req) => capture(req.url()));
    };
    browser.on('targetcreated', targetHandler);

    await gamePage.goto(link.href, { waitUntil: 'networkidle2', timeout: 30000 });

    // Listen on all iframes
    for (const frame of gamePage.frames()) {
      frame.on('request', (req) => capture(req.url()));
    }

    // Try clicking play buttons inside iframes
    for (const frame of gamePage.frames()) {
      try { await frame.click('video'); } catch {}
      try { await frame.click('.play-button, .vjs-big-play-button, .ytp-play-button, [aria-label="Play"]'); } catch {}
    }

    // Wait up to 6 seconds for a stream to appear
    await Promise.race([
      new Promise(r => setTimeout(r, 6000)),
      new Promise(r => {
        const interval = setInterval(() => {
          if (m3u8Urls.size > 0) { clearInterval(interval); r(); }
        }, 200);
      })
    ]);

    if (m3u8Urls.size === 0) {
      console.log(`   ⏭️  No stream after 6s, skipping...\n`);
    } else {
      console.log('');
    }

    m3u8Found = [...m3u8Urls][0] || null;

    browser.off('targetcreated', targetHandler);
    await gamePage.close();
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}\n`);
  }

  results.push({ ...link, m3u8: m3u8Found });
}

await browser.close();

// Build M3U playlist
let playlist = '#EXTM3U\n\n';
let count = 0;

for (const { text, href, m3u8 } of results) {
  if (!m3u8) continue;
  count++;
  playlist += `#EXTINF:-1 tvg-name="${text}" group-title="NBA",${text}\n`;
  playlist += `#EXTVLCOPT:http-referrer=${href}\n`;
  playlist += `#EXTVLCOPT:http-origin=https://crackstreams.ms\n`;
  playlist += `${m3u8}\n\n`;
}

fs.writeFileSync('nba_streams.m3u', playlist);


console.log(`✅ Done! ${count}/${results.length} streams found.`);
console.log(`   📄 crackstreams.json`);
console.log(`   📺 nba_streams.m3u`);