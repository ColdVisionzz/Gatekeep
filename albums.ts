export type Album = {
  id: number;
  title: string;
  artist: string;
  artistId: number;
  cover: string; // 1000px, for the recap and export
  thumb: string; // 250px, for lists
};

type DeezerAlbum = {
  id: number;
  title: string;
  md5_image: string;
  cover_xl: string;
  cover_medium: string;
  artist: { id: number; name: string };
};

export function toAlbum(raw: DeezerAlbum): Album {
  return {
    id: raw.id,
    title: raw.title,
    artist: raw.artist.name,
    artistId: raw.artist.id,
    cover: raw.cover_xl,
    thumb: raw.cover_medium,
  };
}

export async function searchAlbums(q: string, signal?: AbortSignal): Promise<Album[]> {
  let res: Response;
  try {
    res = await fetch(`https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=25`, {
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    // fetch only rejects on network failure (offline, DNS, TLS), so say that rather than "Network request failed"
    throw new Error('No connection. Check your internet and try again.');
  }
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = await res.json();
  // Deezer reports errors such as quota limits as HTTP 200 with an `error` object
  if (json.error) throw new Error(json.error.message ?? 'Search failed');
  // Albums without artwork have an empty md5_image and a broken cover URL
  return (json.data as DeezerAlbum[]).filter((a) => a.md5_image).map(toAlbum);
}
