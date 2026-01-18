import { writeFile, readFile } from 'fs/promises';
const raw = await readFile(
  new URL('./broadcasts.json', import.meta.url),
  'utf-8'
);

const broadcasters = JSON.parse(raw);
const broadcasterMap = broadcasters.reduce((acc, broadcaster) => {
  acc[broadcaster.id] = broadcaster;
  return acc;
}, {});

async function fetchEvents() {
  try {
    const response = await fetch('https://site.web.api.espn.com/apis/site/v2/guide/feed?leagues=nba%2Cnfl%2Ceng.1');
    const data = await response.json();
    
    // Create an object keyed by event ID
    const eventsDictionary = data.events.reduce((acc, { id, displayName, watch }) => {
      acc[id] = {
        title: displayName,
        broadcasts: watch.broadcasts.map(({ broadcasterId }) => {
          // Get full broadcaster info
          const broadcasterInfo = broadcasterMap[broadcasterId];
          
          let deeplink = null;
          switch (broadcasterId) {
            case 763: // Prime Video
              break;
            case 139: // ESPN 2
              deeplink = `sportscenter://x-callback-url/showWatchStream?playChannel=espn2`;
            case 126: // ESPN
              deeplink = `sportscenter://x-callback-url/showWatchStream?playChannel=espn1`;
              break;
            case 887: // NBA League Pass
              deeplink = `gametime://game/00${Number(id) - 379309855}`;
              break;
            default:
              console.log(`No deeplink for broadcaster: ${broadcasterInfo?.name || broadcasterId}`);
          }
          
          return {
            id: broadcasterId,
            name: broadcasterInfo?.name || 'Unknown',
            logoUrl: broadcasterInfo?.logoUrl || null,
            type: broadcasterInfo?.type || null,
            deeplink: deeplink
          };
        }).filter(broadcast => broadcasterMap[broadcast.id]) // Only include known broadcasters
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

//NBA:  https://tv.apple.com/api/uts/v3/shelves/uts.col.SportsRelated.umc.cse.67kkuyv8dsexy9dx1tvoj6ulh?caller=web&locale=en-US&pfm=web&sf=143441&utscf=OjAAAAEAAAAAAAIAEAAAACMAKwAtAA%7E%7E&utsk=6e3013c6d6fae3c2%3A%3A%3A%3A%3A%3A235656c069bb0efb&v=92

//NFL:  https://tv.apple.com/api/uts/v3/shelves/uts.col.SportsRelated.umc.cse.5vvmqj7yumant3n5u51i58f8q?caller=web&locale=en-US&pfm=web&sf=143441&utscf=OjAAAAEAAAAAAAIAEAAAACMAKwAtAA%7E%7E&utsk=6e3013c6d6fae3c2%3A%3A%3A%3A%3A%3A235656c069bb0efb&v=92

// EPL: https://tv.apple.com/api/uts/v3/shelves/uts.col.SportsRelated.umc.cse.22kkr4ha0jekxtcdlalgsj7b?caller=web&locale=en-US&pfm=web&sf=143441&utscf=OjAAAAEAAAAAAAIAEAAAACMAKwAtAA%7E%7E&utsk=6e3013c6d6fae3c2%3A%3A%3A%3A%3A%3A235656c069bb0efb&v=92
async function fetchDeeplinks() {
  try {
    const response = await fetch('https://tv.apple.com/api/uts/v3/shelves/uts.col.SportsRelated.umc.cse.5vvmqj7yumant3n5u51i58f8q?caller=web&locale=en-US&pfm=web&sf=143441&utscf=OjAAAAEAAAAAAAIAEAAAACMAKwAtAA%7E%7E&utsk=6e3013c6d6fae3c2%3A%3A%3A%3A%3A%3A235656c069bb0efb&v=92');
    
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

    await writeFile('event-deeplinks.json', JSON.stringify(formatedEvents, null, 2));
    
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

// fetchDeeplinks();
fetchEvents();

// Run the function
