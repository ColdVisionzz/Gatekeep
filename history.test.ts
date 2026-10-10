// Run: npx tsx history.test.ts
import type { Album } from './albums';
import { dayKey, lastDays, parseHistory, stats } from './history';

function eq(actual: unknown, expected: unknown, msg = '') {
  const [a, e] = [JSON.stringify(actual), JSON.stringify(expected)];
  if (a !== e) throw new Error(`${msg}\n  expected ${e}\n  got      ${a}`);
}

const album = (id: number, title: string, artistId: number, artist: string): Album => ({
  id,
  title,
  artist,
  artistId,
  cover: '',
  thumb: '',
});
const okc = album(1, 'OK Computer', 399, 'Radiohead');
const kida = album(2, 'Kid A', 399, 'Radiohead');
const blonde = album(3, 'Blonde', 7, 'Frank Ocean');
const rumours = album(4, 'Rumours', 9, 'Fleetwood Mac');

eq(dayKey(new Date(2026, 0, 5)), '2026-01-05', 'dayKey pads month and day');

eq(parseHistory('{"2026-01-05":[]}'), { '2026-01-05': [] });
eq(parseHistory('{"2026-01-0'), null, 'truncated JSON is rejected');
eq(parseHistory('null'), null, 'null is rejected');
eq(parseHistory('[]'), null, 'arrays are rejected');

const s = stats({
  '2026-01-01': [okc, blonde, rumours, kida],
  '2026-01-02': [okc, blonde],
  '2026-01-03': [okc],
});
eq(s.days, 3);
eq(
  s.topAlbums.map((a) => [a.album.title, a.count]),
  [['OK Computer', 3], ['Blonde', 2], ['Kid A', 1], ['Rumours', 1]],
  'albums sorted by count, then title',
);
eq(
  s.topArtists.map((a) => [a.name, a.count]),
  [['Radiohead', 4], ['Frank Ocean', 2], ['Fleetwood Mac', 1]],
  'artists grouped by ID across different albums',
);
eq(s.topAlbums[0].days, ['2026-01-03', '2026-01-02', '2026-01-01'], 'album days newest first');

const now = new Date(2026, 2, 10);
const h = { '2026-03-10': [okc], '2026-03-04': [kida], '2026-03-03': [blonde], '2025-12-01': [rumours] };
eq(Object.keys(lastDays(h, 7, now)), ['2026-03-10', '2026-03-04'], '7 days includes today and 6 before');
eq(Object.keys(lastDays(h, 90, now)), ['2026-03-10', '2026-03-04', '2026-03-03'], '90 days crosses month ends');
eq(Object.keys(lastDays(h, 1, now)), ['2026-03-10'], '1 day is today only');

eq(stats({}), { days: 0, topAlbums: [], topArtists: [] });

console.log('history.test.ts: ok');
