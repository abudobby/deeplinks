import { readFileSync } from 'fs';

const API_BASE = 'https://schedule-admin.sportsnet.ca/v1/events';
const broadcasts = JSON.parse(readFileSync('./broadcasts.json', 'utf8'));

const formatTime = (utcSeconds) =>
  new Date(utcSeconds * 1000).toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const findChannel = (channelId, broadcasterName, broadcasterImg) => {
  const needle = (channelId.trim() || broadcasterName).toLowerCase();
  return (
    broadcasts.find(({ searchTokens = [] }) =>
      searchTokens.some((token) => needle === token.toLowerCase())
    ) ?? {
      id: null,
      name: broadcasterName,
      logoUrl: broadcasterImg,
      isNational: false,
      hasLocalAffiliate: false,
      type: 'tv',
      searchTokens: [],
      excludedSearchTokens: [],
    }
  );
};

// Normalize title for matching against ESPN: strip league prefix, game suffix, convert @ to vs.
const toMatchTitle = (title) =>
  title
    .replace(/^[^:]+:\s*/, '')         // "HNIC IN PUNJABI: X @ Y" → "X @ Y"
    .replace(/\s*-\s*Game\s*\d+.*$/i, '') // "X @ Y - Game 4" → "X @ Y"
    .replace(/\s*@\s*/, ' vs. ')       // "X @ Y" → "X vs. Y"
    .trim();

const getDayRange = () => {
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
  const startMs = new Date(`${todayStr}T00:00:00-04:00`).getTime();
  return {
    day_start: Math.floor(startMs / 1000),
    day_end: Math.floor(startMs / 1000) + 86399,
  };
};

const parseGames = (events) =>
  events
    .filter(({ event_name }) => event_name.includes(' vs. ') || event_name.includes(' @ '))
    .map(({ event_name, channel_id, primary_broadcaster, primary_broadcaster_img, start_time_utc, end_time_utc, deep_link_ios, league }) => ({
      title: event_name,
      matchTitle: toMatchTitle(event_name),
      sport: league,
      channel: findChannel(channel_id, primary_broadcaster, primary_broadcaster_img),
      start: formatTime(start_time_utc),
      end: formatTime(end_time_utc),
      deeplink: deep_link_ios ?? null,
    }));

export async function fetchSportsnetGames() {
  const { day_start, day_end } = getDayRange();
  const res = await fetch(`${API_BASE}?day_start=${day_start}&day_end=${day_end}&sort=desc`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { data } = await res.json();
  return parseGames(data);
}
