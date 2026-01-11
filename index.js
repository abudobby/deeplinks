import { writeFile } from 'fs/promises';

async function fetchJoke() {
  try {
    const response = await fetch('https://site.web.api.espn.com/apis/site/v2/guide/feed?leagues=nba');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const filteredEvents = data.events.map(event => ({
      id: event.id,
      title: event.displayName,
      broadcasts: event.watch.broadcasts.map(b => ({
        id: b.broadcasterId,
        deeplink: b.broadcasterId === 887 
          ? `gametime://game/00${parseInt(event.id) - 379309855}`
          : ""
      }))
    }));
    
    // Write to JSON file
    await writeFile('event-broadcasts.json', JSON.stringify(filteredEvents, null, 2));
    s
    console.log('✅ Successfully wrote event-broadcasts.json');
    console.log(`📊 Total events: ${filteredEvents.length}`);
    
  } catch (error) {
    console.error('Error fetching events:', error.message);
  }
}

// Run the function
fetchJoke();