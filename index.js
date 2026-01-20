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
    const response = await fetch('https://site.web.api.espn.com/apis/site/v2/guide/feed?leagues=nba%2Cnfl%2Ceng.1%2Ccollege-football');
    const data = await response.json();

        const peacockResponse = await searchPeacock()
                const nbcResponse = await fetchNBCSportsData()


const peacockSchedule = peacockResponse.data.search.results
  .filter(item => {
    const eventStage = item.formats?.HD?.eventStage;
    return eventStage === "LIVE" || eventStage === "UPCOMING";
  })
  .map(item => ({
    programmeUuid: item.programmeUuid,
    title: item.title,
    eventStage: item.formats.HD.eventStage
  }));


    
    // Create an object keyed by event ID
const eventsDictionary = data.events.reduce((acc, { id, competitors, displayName, watch }) => {
  acc[id] = {
    title: displayName,
    broadcasts: watch.broadcasts.map(({ broadcasterId }) => {
      // Get full broadcaster info
      const broadcasterInfo = broadcasterMap[broadcasterId];
      let deeplink = null;
      let hometeam = competitors[0].team.name;
      let awayTeam = competitors[1].team.name;
      let title = `${awayTeam} vs. ${hometeam}`;
      
      switch (broadcasterId) {
        case 379:
        case 894:
        case 891:
        case 890:
        case 892: {
          const liveAndUpcomingShelf = nbcResponse.data.page.data.sections[1];
          const nbcEvents = liveAndUpcomingShelf.data.items.map(i => i.data);
          const nbcEvent = nbcEvents.find(event => event.secondaryTitle === title);
          deeplink = `nbcsportstve://watch/${nbcEvent.pid}`;
          break;
        }
        case 789: {
          const found = peacockSchedule.find(item => item.title === title);
          const deeplinkData = {
            pvid: found.programmeUuid,
            type: 'SLE',
            action: 'PLAY'
          };
          const baseUrl = 'https://www.peacocktv.com/deeplink';
          const params = new URLSearchParams({
            deeplinkData: JSON.stringify(deeplinkData)
          });
          deeplink = `${baseUrl}?${params.toString()}`;
          break;
        }
        case 763: // Prime Video
          break;
        case 139: // ESPN 2
          deeplink = `sportscenter://x-callback-url/showWatchStream?playChannel=espn2`;
          break;
        case 126: // ESPN
          deeplink = `sportscenter://x-callback-url/showWatchStream?playChannel=espn1`;
          break;
        case 887: // NBA League Pass
          deeplink = `gametime://game/00${Number(id) - 379309855}`;
          break;
        default:
          break;
      }
      
      return {
        id: broadcasterId,
        name: broadcasterInfo?.name || 'Unknown',
        logoUrl: broadcasterInfo?.logoUrl || null,
        type: broadcasterInfo?.type || null,
        searchTokens: broadcasterInfo?.searchTokens || [],
        excludedSearchTokens: broadcasterInfo?.excludedSearchTokens || [],
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

async function searchPeacock() {
  const url = 'https://bff-ext.clients.peacocktv.com/bff/search/v2?term=Sports&limit=40&entityType=PROGRAMME';
  
  const options = {
    method: 'GET',
    headers: {
      'Host': 'bff-ext.clients.peacocktv.com',
      'User-Agent': 'PeacockIOS-US/7.1.12-07011200',
      'X-SkyOTT-Proposition': 'NBCUOTT',
      'X-SkyOTT-Territory': 'US',
      'X-SkyOTT-Language': 'en',
      'Connection': 'keep-alive',
      'X-SkyOTT-Device': 'MOBILE',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': '*/*',
      'X-SkyOTT-Platform': 'IOS'
    }
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data
  } catch (error) {
    console.error('Error:', error);
  }
}

async function fetchNBCSportsData() {
  const url = 'https://friendship.nbc.com/v3/graphql?variables=%7B%22userId%22%3A%227992590264571284474%22%2C%22device%22%3A%22web%22%2C%22platform%22%3A%22web%22%2C%22language%22%3A%22en%22%2C%22authorized%22%3Afalse%2C%22isDayZero%22%3Afalse%2C%22name%22%3A%22sport%22%2C%22type%22%3A%22LANDING_PAGE%22%2C%22subType%22%3A%22sportHome%22%2C%22timeZone%22%3A%22America%2FChicago%22%2C%22nbcAffiliateName%22%3A%22kare%22%2C%22telemundoAffiliateName%22%3A%22kjnk%22%2C%22nationalBroadcastType%22%3A%22eastCoast%22%2C%22app%22%3A%22nbc%22%2C%22appVersion%22%3A1248001%2C%22queryName%22%3A%22page%22%7D&extensions=%7B%22persistedQuery%22%3A%7B%22version%22%3A1%2C%22sha256Hash%22%3A%22661bcb56e11fbe0692168bc41f864967ba8bbaa160985099c3092877e9b8dddc%22%7D%7D';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Sec-Fetch-Site': 'same-site',
        'Origin': 'https://www.nbc.com',
        'Sec-Fetch-Dest': 'empty',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Mode': 'cors',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Safari/605.1.15',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.nbc.com/',
        'Priority': 'u=3, i'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching NBC sports data:', error);
    throw error;
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
