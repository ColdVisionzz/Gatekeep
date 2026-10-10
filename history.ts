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
