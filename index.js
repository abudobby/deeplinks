import { writeFile, readFile } from 'fs/promises';
import { fetchTSNGames } from './tsn.js';
import { fetchSportsnetGames } from './sportsnet.js';
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
    const response = await fetch('https://site.api.espn.com/apis/site/v2/guide/feed?leagues=nba,mlb,nhl,uefa.champions,eng.1,mens-college-basketball,esp.1&limit=200');
    const data = await response.json();
        const peacockResponse = await searchPeacock()
        const nbcResponse = await fetchNBCSportsData()
        const paramountResponse = await fetchParamountSportsData()
        const primeVideoResponse = await fetchPrimeVideoSportsData()
        const tsnGames = await fetchTSNGames()
        const sportsnetGames = await fetchSportsnetGames()

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
const eventsDictionary = data.events.reduce((acc, { id, competitors, displayName, watch, league }) => {
  const gameTitle = `${competitors[1].team.name} vs. ${competitors[0].team.name}`;

  let broadcasts = watch.broadcasts.map(({ broadcasterId }) => {
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
          // deeplink = `nbcsportstve://watch/${nbcEvent.pid}`;
          break;
        }
        case 763: {
          let items = primeVideoResponse.resource.containers[0].standardCarousel.items
          const event = items.find(item => item.title === title);
          // console.log(event.gti)
          //      if (event) {                                                                             
          //        deeplink = `aiv://aiv/detail?gti=${event.gti}`;                                 
          //     }  
         break
        }
        case 792: {
                let hometeam = competitors[0].team.name;
      let awayTeam = competitors[1].team.name;
      let title = `${hometeam} vs. ${awayTeam}`;
          const events = paramountResponse.result.data;
          const event = findBestMatch(title, events)         
          deeplink = `pplus://www.paramountplus.com/live-tv/stream/${event.channelSlug}/${event.content_id}`;
                    break;
        }
        case 789: {
          const event = findBestMatch(title, peacockSchedule)         
          const deeplinkData = {
            pvid: event.programmeUuid,
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
        case 755:
          deeplink = `sportscenter://x-callback-url/showWatchStream?playGameID=${id}`
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
        hasLocalAffiliate: broadcasterInfo?.hasLocalAffiliate || false,
        isNational: broadcasterInfo?.isNational || false,
        type: broadcasterInfo?.type || null,
        searchTokens: broadcasterInfo?.searchTokens || [],
        excludedSearchTokens: broadcasterInfo?.excludedSearchTokens || [],
        deeplink: deeplink
      };
    }).filter(broadcast => broadcasterMap[broadcast.id]); // Only include known broadcasters

  const tsnMatch = findBestMatch(gameTitle, tsnGames, 0.5);
  if (tsnMatch?.channel) {
    const { channel } = tsnMatch;
    if (!broadcasts.some(b => b.id === channel.id)) {
      broadcasts.push({
        id: channel.id,
        name: channel.name,
        logoUrl: channel.logoUrl,
        hasLocalAffiliate: channel.hasLocalAffiliate,
        isNational: channel.isNational,
        type: channel.type,
        searchTokens: channel.searchTokens,
        excludedSearchTokens: channel.excludedSearchTokens || [],
        deeplink: null
      });
    }
  }

  const sportsnetMatchable = sportsnetGames.map(g => ({ ...g, title: g.matchTitle }));
  const sportsnetMatch = findBestMatch(displayName, sportsnetMatchable, 0.4);
  if (sportsnetMatch) {
    const { channel, deeplink } = sportsnetMatch;
    const duplicate = channel.id !== null
      ? broadcasts.some(b => b.id === channel.id)
      : broadcasts.some(b => b.name === channel.name);
    if (!duplicate) {
      broadcasts.push({
        id: channel.id,
        name: channel.name,
        logoUrl: channel.logoUrl,
        hasLocalAffiliate: channel.hasLocalAffiliate,
        isNational: channel.isNational,
        type: channel.type,
        searchTokens: channel.searchTokens,
        excludedSearchTokens: channel.excludedSearchTokens || [],
        deeplink
      });
    }
  }

  acc[id] = { title: displayName, broadcasts };
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

async function fetchParamountSportsData(offset = 0, limit = 0) {
  const configId = 'VoQUVc0J62d%2BioDjqMDYM8Vzayms9JPg%2B%2FXQSFBmOUWLbaxWazbn6rluIYutH2IxseozC9PXeRm8qD6NhrcVy%2B7BaCtt%2F8VrlucLBigEb2135P67vlgjtxGds4rMwADky1k1VOaKamVGHUFUrVRtDsmKskTtZZ9KBWNepo6JU5zjlQwYGSghZrIgr6dYu1tSsSHICrug2ca5tPbUCqc0l4OVMTaXNVYZSnT7z2OzKHBDl%2B5T2DIelHWxVEabMBp6ahOSBRtZmTb2bPQvCoQ0QRiedOqi%2BOp1Pg1iQ%2Bc87gC4thkH6Gtt5HZvDaIlCand5Zx2vhE3GtbokZ4FI8NpsZpqlasCMy2Oy8Kv%2FfZ4WuK%2BjSOd1sC7leU6qO3JQU6PGSyTMDTBpA9mCMzQpAN8%2BbEbhn7lYCo6scmCoCiTZ0%2FvE8C3e9JfQXrVOVCMGLtzdx1or4b993APdXSYibvEf8MpPleSmGHIMdtOR%2Fyy0vi4KfmbXNvATqxCGIQBocG4LrjFfvRm0pmc8qw5MrbyOY%2FV74U%2BkVpieGNGDlvZZtCqjGpCN11tYb4q8YWk4tLZRVF5YjXT%2BVTCiU4%2B1JNZlg%3D%3D';
  
  const url = `https://www.paramountplus.com/carousels/collections/configItems/rg/${configId}/offset/${offset}/limit/${limit}/`;
  
  const headers = {
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
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Paramount carousel:', error);
    throw error;
  }
}

async function fetchAmazonToken() {
  const url = 'https://api.amazon.com/auth/token';
  const body = {
    "age_info": {},
    "previous_version": "6.18.3",
    "source_device_tokens": [
      {
        "device_type": "AK6OCP5ZLUJI1",
        "account_refresh_token": {
          "token": "Atnr|EwMDIE8DG-lXvDzYGDANR3PGsNKBoBPUB-EfOX04GJqVwFDYZe3iVWgSDm89EVTPhGtFqY0zRFlT1SQzFGEebE95ur_u5PWSR1218Hzkb-EQMc6mz9AbdgD6netElYQU4qW2sjCZJhc1ct0kiKAolMRYVsr0PONOE-RKv43EzhpB5_bdUxf3THBOjR7IqjI2G_pbmpsdBX1l_XibcP-zRVCINrTQBXajY6cIzjZ2qkp7pNP6trpFrvb79wOazsqk21niJ_z71Q4Z4kDBMy5V9wfQFh7Ly4lWdk866pvMZ6KXR5yjt04PDO3mxXwwxtKT-44firRtJm1YO0FgI8GVAzb8KaUo"
        },
        "actor_refresh_token": {
          "token": "Atnr|EwMDIB_jiAPaA_fPoQ-IxYG4K-iAnFPOP52ZHV22PsXPKPZrDM9RLhURTxawRmYhP7jKBuqJ6irBoWUuwlfRZUltUD94P9Zvh3UOkfing4JlhykDAiJaf_6LgDG8_HR0B6y1om4aDB5cTnyhyxs05tcNJnMCJERRihYVl0mMzN05oM0Qdec9xTJW7geTGlJrQcLfvin1vqLOiJSlG0n-kUwKSsGH85d6FJjKfU55jN5W0FYFzHEpFG8yaK7jLw5fhTbaYtYCfBu6bum2YuAK0jFhFd8bxjPvhVG9UqR4hdD5cXADnUs3dwTrTO4umNHkOaOIQT0CRj9MptMv-DOgIFTMnyvUpN0Yl85O2H6fC1yuDppfq4QkDgUyBXh240Kz98juzJTlm9COvMrk9Cx-lZOSpHZ3qBZnviujQq2m5rLvS8ZmW3lqWmIedeFTGPlFpqN6A3U"
        }
      }
    ],
    "requested_token_type": "actor_access_token",
    "source_token_type": "refresh_token",
    "platform": "iOS",
    "current_version": "6.18.3",
    "exchange_reason": "miGetATActATInvalidForceRefresh",
    "package_name": "com.amazon.aiv.AIVApp",
    "app_name": "Prime Video",
    "actor_id": "amzn1.actor.person.oid.A33555SB6BNE1"
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Token fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.device_tokens[0].actor_access_token.token;
  return token;
}


async function fetchPrimeVideoSportsData() {
  const url = 'https://abf4d3zfbtw7.na.api.amazonvideo.com/cdp/linearedge/InitialLivePageApple?featureScheme=ios-features-v9.1-zeno&deviceId=D5397D233BF840C68E31A0ECAE09C36A&deviceTypeId=AK6OCP5ZLUJI1';

  try {
    // Fetch a fresh token before each call
    const token = await fetchAmazonToken();

    const headers = {
      'Host': 'abf4d3zfbtw7.na.api.amazonvideo.com',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'x-gasc-enabled': 'true',
      'x-retry-count': '0',
      'x-atv-page-id': 'livetv',
      'User-Agent': 'PrimeVideo/10.113 (iPhone17,2; iOS 26.1; Scale/3.0)',
      'x-atv-page-type': 'ATVHome',
      'Authorization': `Bearer ${token}`,  // dynamically injected
      'Accept-Language': 'en-US,en;q=0.9'
    };

    const response = await fetch(url, { method: 'GET', headers });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Error fetching Prime Video sports data:', error);
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









function findBestMatch(searchString, array, minScore = 0) {
  const normalize = (str) => {
    return str
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .replace(/ø/g, 'o')
      .replace(/\b(fc|cf|as)\b/g, '')
      .trim();
  };

  const calculateSimilarity = (str1, str2) => {
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    const matrix = [];
    const len1 = s1.length;
    const len2 = s2.length;
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  };

  let bestMatch = null;
  let bestScore = 0;
  for (const item of array) {
    const name = item.title;
    const score = calculateSimilarity(searchString, name);
    if (score > bestScore) {
      bestScore = score;  // <-- ADD THIS LINE
      bestMatch = item;
    }
  }
  return bestScore >= minScore ? bestMatch : null;
}