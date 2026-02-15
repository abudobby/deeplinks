import fs from 'fs';

// Step 1: Fetch the index page and extract all game URLs from <a class="competition"> tags
const indexResponse = await fetch('https://buffstreams.plus/index2');
const indexHtml = await indexResponse.text();

const gameUrls = [...indexHtml.matchAll(/<a[^>]+class="competition"[^>]+href="([^"]+)"/g)]
  .map(m => m[1]);

console.log(`Found ${gameUrls.length} URLs:`, gameUrls);

// Step 2: For each URL, fetch and extract title + stream URL
const entries = [];
for (const url of gameUrls) {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const src = html.match(/id="cx-iframe"[^>]+src="([^"]+)"/)?.[1];
    const streamId = src?.split('/').pop();
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1].replace(' - Buffstreams', '').trim();

    if (!streamId || !title) {
      console.log(`Skipping ${url} - missing data`);
      continue;
    }

    const playlistUrl = `https://red2.wecanfix8.space/playlist/${streamId}/load-playlist`;
    entries.push(`#EXTINF:-1 tvg-name="${title}" group-title="Live",${title}
#EXTVLCOPT:http-referrer=https://gooz.aapmains.net/
#EXTVLCOPT:http-origin=https://gooz.aapmains.net
#EXTVLCOPT:http-user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15
${playlistUrl}`);

    console.log(`✓ ${title} -> ${playlistUrl}`);
  } catch (err) {
    console.error(`✗ Failed for ${url}:`, err.message);
  }
}

// Step 3: Write all live stream entries to streams.m3u
fs.writeFileSync('streams.m3u', `#EXTM3U\n${entries.join('\n\n')}`);
console.log(`\nWritten ${entries.length} live streams to streams.m3u`);

// Step 4: Append tv.m3u to streams.m3u
const tv = fs.readFileSync('tv.m3u', 'utf8');
const tvContent = tv.replace(/^#EXTM3U.*\n?/, '');
fs.appendFileSync('streams.m3u', `\n\n${tvContent}`);
console.log('Done! tv.m3u appended to streams.m3u');