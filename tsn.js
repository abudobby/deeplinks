import { readFileSync } from 'fs';

const API_URL = 'https://www.tsn.ca/pf/api/v3/content/fetch/sports-schedule-custom';
const broadcasts = JSON.parse(readFileSync('./broadcasts.json', 'utf8'));

const formatTime = (iso) =>
  new Date(iso).toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const findChannel = (channelName) => {
  const needle = channelName.toLowerCase();
  return broadcasts.find(({ searchTokens = [] }) =>
    searchTokens.some((token) => needle === token.toLowerCase())
  ) ?? null;
};

const parseGames = (items) =>
  items
    .filter(({ headlines }) => headlines?.basic?.includes(' vs. '))
    .map(({ headlines, itemsType, channelName, startTime, endTime, duration }) => ({
      title: headlines?.basic ?? 'Unknown',
      sport: itemsType ?? 'Unknown',
      channel: findChannel(channelName),
      start: formatTime(startTime),
      end: formatTime(endTime),
      duration,
    }));

export async function fetchTSNGames() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return parseGames(data);
}
