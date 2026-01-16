import { writeFile, readFile } from 'fs/promises';
const raw = await readFile(
  new URL('./event-deeplinks.json', import.meta.url),
  'utf-8'
);

const deeplinks = JSON.parse(raw);

async function fetchEvents() {
  try {
    const response = await fetch('https://site.web.api.espn.com/apis/site/v2/guide/feed?leagues=nba');
    const data = await response.json();
    const appleEvents = await fetchDeeplinks();
    
    // Create an object keyed by event ID instead of an array
    const eventsDictionary = data.events.reduce((acc, { id, displayName, watch }) => {
      acc[id] = {
        title: displayName,
        broadcasts: watch.broadcasts.map(({ broadcasterId }) => {
          let deeplink = "";
          if (broadcasterId === 887) {
            deeplink = `gametime://game/00${Number(id) - 379309855}`;
          } else if ([763, 126].includes(broadcasterId)) {
            deeplink = appleEvents.find(e => e.title === displayName)?.broadcasts?.[0]?.deeplink || "";
          }
          return { id: broadcasterId, deeplink };
        })
      };
      return acc;
    }, {});

    // Write to JSON file
    await writeFile('event-broadcasts.json', JSON.stringify(eventsDictionary, null, 2));
    console.log('✅ Successfully wrote event-broadcasts.json');
    console.log(`📊 Total events: ${Object.keys(eventsDictionary).length}`);
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

async function fetchDeeplinks() {
  try {
    const response = await fetch('https://tv.apple.com/api/uts/v3/shelves/uts.col.SportsRelated.umc.cse.67kkuyv8dsexy9dx1tvoj6ulh?caller=web&locale=en-US&pfm=web&sf=143441&utscf=OjAAAAEAAAAAAAIAEAAAACMAKwAtAA%7E%7E&utsk=6e3013c6d6fae3c2%3A%3A%3A%3A%3A%3A235656c069bb0efb&v=92');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

const formatedEvents = data.data.shelf.items.map(item => {
  const uniqueBroadcasts = [
    ...new Map(
      item.playables.map(p => [
        p.serviceId, // key
        {
          id: p.serviceId,
          name: p.serviceName,
          deeplink: p.punchoutUrls.play
        }
      ])
    ).values()
  ];

  return {
    title: item.title,
    date: item.eventTime.gameKickOffStartTime,
    broadcasts: uniqueBroadcasts
  };
});

   return formatedEvents
    
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

// fetchDeeplinks();
fetchEvents();

// Run the function
