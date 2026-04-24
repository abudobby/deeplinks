/**
 * Parse a TSN/Bell Media EPG response into normalized program events.
 *
 * Requires "type": "module" in package.json.
 *
 * Run as CLI:  node parseEvents.js events.json
 * Or import:   import { parseEvents } from "./parseEvents.js";
 */

import { readFileSync } from "node:fs";
import { argv } from "node:process";

/**
 * Parse "HH:mm" duration into total seconds.
 */
export const parseDurationToSeconds = (str) => {
  if (!str || typeof str !== "string") return 0;
  const parts = str.split(":").map((n) => parseInt(n, 10));
  if (parts.length !== 2 || parts.some(Number.isNaN)) return 0;
  const [hours, minutes] = parts;
  return hours * 3600 + minutes * 60;
};

/**
 * Format seconds as a human-readable duration, e.g. "2h 30m" or "45m".
 */
export const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

/**
 * Normalize a single raw EPG item.
 */
export const parseEvent = (raw) => {
  const startTime = raw.startTime ? new Date(raw.startTime) : null;
  const endTime = raw.endTime ? new Date(raw.endTime) : null;
  const now = new Date();

  const durationSeconds = parseDurationToSeconds(raw.duration);
  const computedDurationSeconds =
    startTime && endTime ? Math.round((endTime - startTime) / 1000) : 0;

  const isLive = !!(startTime && endTime && now >= startTime && now < endTime);
  const hasEnded = !!(endTime && now >= endTime);
  const hasStarted = !!(startTime && now >= startTime);

  let liveProgress = null;
  if (isLive) {
    const total = endTime - startTime;
    const elapsed = now - startTime;
    liveProgress = Math.min(Math.max(elapsed / total, 0), 1);
  }

  return {
    id: `${raw.channelName}-${startTime ? startTime.getTime() : "?"}`,
    title: raw.headlines?.basic || "(untitled)",
    description: raw.description?.basic || "",
    channelName: raw.channelName,
    mediaName: raw.media?.name ?? null,
    category: raw.itemsType ?? null,
    type: raw.type ?? null,
    axisId: raw.axisId ?? null,
    gameId: raw.additional_properties?.gameId ?? null,
    startTime,
    endTime,
    durationSeconds: durationSeconds || computedDurationSeconds,
    durationLabel: formatDuration(durationSeconds || computedDurationSeconds),
    isLive,
    hasEnded,
    hasStarted,
    liveProgress,
    requiredResources: (raw.authentication?.resources ?? []).map(
      (r) => r.resourceCode
    ),
    logoUrl: raw.logo_image?.originalImage ?? null,
  };
};

/**
 * Parse the full response array, sorted by start time.
 */
export const parseEvents = (rawArray) => {
  if (!Array.isArray(rawArray)) {
    throw new Error("Expected an array of events");
  }
  return rawArray
    .map(parseEvent)
    .sort(
      (a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
    );
};

/**
 * Group parsed events by channelName.
 */
export const groupByChannel = (events) => {
  const map = new Map();
  for (const ev of events) {
    if (!map.has(ev.channelName)) map.set(ev.channelName, []);
    map.get(ev.channelName).push(ev);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.startTime - b.startTime);
  }
  return map;
};

/**
 * Get the currently-airing program per channel.
 */
export const nowPlaying = (events) => {
  const map = new Map();
  for (const ev of events) {
    if (ev.isLive) map.set(ev.channelName, ev);
  }
  return map;
};

/**
 * Get upcoming events within the next N hours.
 */
export const upcomingWithin = (events, hours = 3) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() + hours * 3600 * 1000);
  return events.filter(
    (ev) => ev.startTime && ev.startTime >= now && ev.startTime <= cutoff
  );
};

/**
 * Filter events by category (e.g. "Basketball", "News").
 */
export const byCategory = (events, category) =>
  events.filter((ev) => ev.category?.toLowerCase() === category.toLowerCase());

/**
 * Filter events by channel name.
 */
export const byChannel = (events, channelName) =>
  events.filter((ev) => ev.channelName === channelName);

// ---------------------------------------------------------------------------
// CLI entry point — runs only when invoked directly, not when imported.
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${argv[1]}`) {
  const path = argv[2];
  if (!path) {
    console.error("Usage: node parseEvents.js <events.json>");
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(path, "utf8"));
  const events = parseEvents(raw);

  console.log(`Parsed ${events.length} events\n`);

  console.log("=== Now playing ===");
  for (const [channel, ev] of nowPlaying(events)) {
    const pct = Math.round((ev.liveProgress ?? 0) * 100);
    console.log(`  ${channel.padEnd(10)} ${ev.title} (${pct}% done)`);
  }

  console.log("\n=== Upcoming in next 3h ===");
  for (const ev of upcomingWithin(events, 3)) {
    console.log(
      `  ${ev.startTime.toISOString()}  ${ev.channelName.padEnd(10)} ${ev.title}`
    );
  }

  console.log("\n=== Sports events ===");
  const sportsCategories = ["Basketball", "Softball", "Hockey", "Football", "Baseball"];
  const sports = events.filter((ev) => sportsCategories.includes(ev.category));
  for (const ev of sports) {
    console.log(
      `  ${ev.startTime.toISOString()}  ${ev.channelName.padEnd(10)} [${ev.category}] ${ev.title}`
    );
  }
}