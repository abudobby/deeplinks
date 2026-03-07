import { writeFileSync, readFileSync, appendFileSync } from "fs";

const M3U8_URL = "https://raw.githubusercontent.com/doms9/iptv/default/M3U8/TV.m3u8";

async function fetchAndFilterStreams(filterKeyword) {
  const response = await fetch(M3U8_URL);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
  const text = await response.text();

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const entries = [];
  let current = [];

  for (const line of lines) {
    if (line.startsWith("#EXTINF") && current.length > 0) {
      entries.push(current);
      current = [];
    }
    if (!line.startsWith("#EXTM3U")) {
      current.push(line);
    }
  }
  if (current.length > 0) entries.push(current);

  const filtered = entries.filter((entry) => {
    const extinf = entry.find((l) => l.startsWith("#EXTINF"));
    return extinf && extinf.toUpperCase().includes(filterKeyword.toUpperCase());
  });

  if (filtered.length === 0) {
    console.log(`No entries found matching "${filterKeyword}"`);
  } else {
    console.log(`Found ${filtered.length} entries matching "${filterKeyword}":\n`);
    const output = "#EXTM3U\n" + filtered.map((entry) => entry.join("\n")).join("\n\n");
    writeFileSync("streams.m3u", output, "utf8");

    const tvContents = readFileSync("tv.m3u", "utf8");
    const tvWithoutHeader = tvContents.replace(/^#EXTM3U.*\n?/i, "");
    appendFileSync("streams.m3u", "\n" + tvWithoutHeader, "utf8");

    console.log("Results written to streams.m3u with tv.m3u appended");
  }
}

fetchAndFilterStreams("SHARK").catch(console.error);
