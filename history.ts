// Pure history logic. File I/O lives in historyStore.ts so this file runs under Node for tests.
import type { Album } from './albums';

// Local date key (YYYY-MM-DD) -> the 4 albums picked that day
export type History = Record<string, Album[]>;

export function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Returns null when the text is not a history object, so the caller can set the file aside
export function parseHistory(text: string): History | null {
  try {
    const h = JSON.parse(text);
    return h && typeof h === 'object' && !Array.isArray(h) ? h : null;
  } catch {
    return null;
  }
}

// The last n days, today included. Calendar math (not ms) so DST shifts never move the cutoff.
export function lastDays(h: History, n: number, now = new Date()): History {
  const cutoff = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1)));
  return Object.fromEntries(Object.entries(h).filter(([k]) => k >= cutoff));
}

// "2026-01-05" -> local date. new Date("2026-01-05") would parse as UTC and can land on the previous day.
export function toDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export const formatDay = (key: string) => toDate(key).toLocaleDateString(undefined, { dateStyle: 'long' });

// Days an album was picked, newest first
export const albumDays = (h: History, id: number): string[] =>
  Object.keys(h)
    .filter((k) => h[k].some((a) => a.id === id))
    .sort()
    .reverse();

// Days an artist had any album picked, newest first
export const artistDays = (h: History, artistId: number): string[] =>
  Object.keys(h)
    .filter((k) => h[k].some((a) => a.artistId === artistId))
    .sort()
    .reverse();

// The n albums most often picked on the same day as `id`
export function topCombos(h: History, id: number, n = 3): { album: Album; count: number }[] {
  const combos = new Map<number, { album: Album; count: number }>();
  for (const day of Object.values(h)) {
    if (!day.some((a) => a.id === id)) continue;
    for (const a of day) {
      if (a.id === id) continue;
      const c = combos.get(a.id) ?? { album: a, count: 0 };
      c.count++;
      combos.set(a.id, c);
    }
  }
  return [...combos.values()]
    .sort((x, y) => y.count - x.count || x.album.title.localeCompare(y.album.title))
    .slice(0, n);
}

// The n other artists most often picked on the same day as `artistId`
export function topArtistCombos(h: History, artistId: number, n = 3): ArtistCount[] {
  const combos = new Map<number, ArtistCount>();
  for (const day of Object.values(h)) {
    if (!day.some((a) => a.artistId === artistId)) continue;
    // A day counts once per artist, however many of their albums it holds
    for (const a of new Map(day.map((x) => [x.artistId, x])).values()) {
      if (a.artistId === artistId) continue;
      const c = combos.get(a.artistId) ?? { artistId: a.artistId, name: a.artist, count: 0 };
      c.count++;
      combos.set(a.artistId, c);
    }
  }
  return [...combos.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)).slice(0, n);
}

export type AlbumCount = { album: Album; count: number };
export type ArtistCount = { artistId: number; name: string; count: number };

export function stats(h: History) {
  const albums = new Map<number, AlbumCount>();
  const artists = new Map<number, ArtistCount>();
  for (const day of Object.values(h)) {
    for (const a of day) {
      // ponytail: editions (remaster, deluxe) have different Deezer IDs and count separately; group by normalized title + artist if that bothers users
      const al = albums.get(a.id) ?? { album: a, count: 0 };
      al.count++;
      albums.set(a.id, al);
      const ar = artists.get(a.artistId) ?? { artistId: a.artistId, name: a.artist, count: 0 };
      ar.count++;
      artists.set(a.artistId, ar);
    }
  }
  return {
    days: Object.keys(h).length,
    topAlbums: [...albums.values()].sort(
      (x, y) => y.count - x.count || x.album.title.localeCompare(y.album.title),
    ),
    topArtists: [...artists.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name)),
  };
}
