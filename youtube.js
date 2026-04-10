const PLAYLISTS = {
  nba: "PLlVlyGVtvuVlek5UOvwJaRDtuAI1FgGZf",
  "mens-college-basketball": "PLXCWZ2G0LOasfGYXzgE7mZajWMRYSCG0E",
  nhl: "PL1NbHSfosBuFyu867mbHHhB2G6fx7jtiH"
};

const fetchPage = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  return res.text();
};

const getPlaylistUrls = async () => {
  const result = {};

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

    result[key] = videos;
  }

  // Limit to 15 videos per category
  Object.keys(result).forEach(key => {
    result[key] = result[key].slice(0, 15);
  });

  console.log(JSON.stringify(result, null, 2));

  // Save to file
  await fs.writeFile('highlights.json', JSON.stringify(result, null, 2));
  console.log('\n✓ Saved to highlights.json');
};

getPlaylistUrls().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

import fs from 'fs/promises';