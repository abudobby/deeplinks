const PLAYLISTS = {
  nba: "PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf",
  "mens-college-basketball": "PLXCWZ2G0LOasfGYXzgE7mZajWMRYSCG0E",
  nhl: "PL1NbHSfosBuFyu867mbHHhB2G6fx7jtiH",
  "europa-league": "PLF1A3xcj_XjauRnOMIAX0CQbMhJbbcDvN",
  "europa-conference-league": "PLF1A3xcj_XjYWfzeXvnO8Uy8K3Q8JIQ5z",
  "la-liga": "PLVWqRc88TLrByvcK1YStLlGViyFTqilCy",
  "serie-a": "PLkwBiY2Dq-oZc2BYatzkvjPA6AKkz0Nhd"
};

const fetchPage = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  return res.text();
};

const getPlaylistUrls = async () => {
  for (const [key, playlistId] of Object.entries(PLAYLISTS)) {
    const html = await fetchPage(`https://www.youtube.com/playlist?list=${playlistId}`);

    const match = html.match(/var ytInitialData = ({.+?});<\/script>/s);
    if (!match) throw new Error(`Could not find ytInitialData for ${key}.`);

    const data = JSON.parse(match[1]);

    const contents =
      data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
        ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]
        ?.playlistVideoListRenderer?.contents;

    if (!contents) throw new Error(`Could not find playlist contents for ${key}.`);

    console.log(`Found ${contents.length} videos in ${key}:\n`);

    const videos = contents
      .filter((item) => item.playlistVideoRenderer)
      .filter((item) => {
        const title = item.playlistVideoRenderer?.title?.runs?.[0]?.text || '';
        const lowerTitle = title.toLowerCase();
        return lowerTitle.includes('highlights');
      })
      .map(({ playlistVideoRenderer: { videoId, title } }) => ({
        title: title?.runs?.[0]?.text || title?.simpleText || 'Untitled',
        url: `youtube://watch/${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
      }));

    const limited = videos.slice(0, 15);
    const filename = `${key}_highlights.json`;
    await fs.writeFile(filename, JSON.stringify(limited, null, 2));
    console.log(`✓ Saved ${limited.length} highlights to ${filename}`);
  }
};

getPlaylistUrls().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

import fs from 'fs/promises';