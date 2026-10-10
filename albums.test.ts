// Run: npx tsx albums.test.ts
// No node:assert import, so the app's tsconfig needs no @types/node
import { searchAlbums, toAlbum } from './albums';

function eq(actual: unknown, expected: unknown, msg = '') {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`${msg}\n  expected ${e}\n  got      ${a}`);
}

const raw = {
  id: 14879699,
  title: 'OK Computer',
  md5_image: '05a1',
  cover_xl: 'https://cdn/1000x1000.jpg',
  cover_medium: 'https://cdn/250x250.jpg',
  artist: { id: 399, name: 'Radiohead' },
};

eq(toAlbum(raw), {
  id: 14879699,
  title: 'OK Computer',
  artist: 'Radiohead',
  artistId: 399,
  cover: 'https://cdn/1000x1000.jpg',
  thumb: 'https://cdn/250x250.jpg',
});

function stubFetch(body: unknown) {
  globalThis.fetch = (async () => new Response(JSON.stringify(body))) as typeof fetch;
}

(async () => {
  stubFetch({ data: [raw, { ...raw, id: 2, md5_image: '' }] });
  const albums = await searchAlbums('ok computer');
  eq(albums.map((a) => a.id), [14879699], 'albums without artwork are dropped');

  stubFetch({ error: { message: 'Quota limit exceeded' } });
  const err = await searchAlbums('ok computer').catch((e: Error) => e.message);
  eq(err, 'Quota limit exceeded', 'Deezer error object becomes a thrown error');

  globalThis.fetch = (async () => {
    throw new TypeError('Network request failed');
  }) as typeof fetch;
  const offline = await searchAlbums('ok computer').catch((e: Error) => e.message);
  eq(offline, 'No connection. Check your internet and try again.', 'network failure gets a readable message');

  globalThis.fetch = (async () => {
    throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
  }) as typeof fetch;
  const aborted = await searchAlbums('ok computer').catch((e: Error) => e.name);
  eq(aborted, 'AbortError', 'aborts pass through so the search box can ignore them');

  console.log('albums.test.ts: ok');
})();
