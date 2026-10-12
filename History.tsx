import { useRef, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { formatDay, lastDays, stats, toDate, type ArtistCount, type History as HistoryData } from './history';
import type { Album } from './albums';
import { loadHistory } from './historyStore';
import AlbumPage from './AlbumPage';
import ArtistPage from './ArtistPage';
import RangePicker from './RangePicker';
import { AlbumRow, ArtistRow, ROW_H } from './StatRows';
import TopList from './TopList';
import DateStamp from './DateStamp';
import { color } from './theme';

type Props = { onClose: () => void };

// Rows shown per section; the full ranking is one tap away
const PREVIEW_ROWS = 4;

type Section = 'albums' | 'artists';

// Mounted only while open, so it rereads history.json each time (picks up today's export).
export default function History({ onClose }: Props) {
  const [{ history, error }] = useState(() => {
    try {
      return { history: loadHistory(), error: null };
    } catch (e) {
      return { history: {} as HistoryData, error: String(e) };
    }
  });
  // Each section has its own range
  const [ranges, setRanges] = useState<Record<Section, number | null>>({ albums: null, artists: null });
  // Section whose full ranking is open; null while closed
  const [full, setFull] = useState<Section | null>(null);
  const [detail, setDetail] = useState<Album | null>(null);
  const [artist, setArtist] = useState<ArtistCount | null>(null);
  const listRef = useRef<FlatList<string>>(null);
  // Stats follow the range; the day list below always shows every day, so a jump always has a row to land on
  const statsFor = (n: number | null) => stats(n ? lastDays(history, n) : history);
  const s = statsFor(ranges.albums);
  const artistStats = statsFor(ranges.artists);
  const days = Object.keys(history).sort().reverse();

  const jumpTo = (key: string) => listRef.current?.scrollToIndex({ index: days.indexOf(key), viewPosition: 0 });

  // Tapping a section heading opens its full ranking
  const heading = (which: Section, text: string) => (
    <Pressable
      onPress={() => setFull(which)}
      hitSlop={12}
      style={({ pressed }) => [styles.range, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${text}, show all`}
    >
      <Text style={styles.label}>{text}</Text>
      <Ionicons name="chevron-forward" size={13} color={color.mute} />
    </Pressable>
  );

  const header = (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>History</Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>Could not read history: {error}</Text>}
      {days.length > 0 && (
        <>
          <Text style={styles.summary}>
            {s.days} {s.days === 1 ? 'day' : 'days'} logged
          </Text>
          {/* Always shown, even for an empty range, so the range picker never disappears */}
          <View style={[styles.sectionRow, styles.section]}>
            {heading('albums', 'Top albums')}
            <RangePicker which="albums" value={ranges.albums} onChange={(n) => setRanges((r) => ({ ...r, albums: n }))} />
          </View>
          {/* Fixed height, so the section never grows or shrinks with the data */}
          <View style={styles.preview}>
            {s.days === 0 && <Text style={styles.rangeEmpty}>No days in this range.</Text>}
            {s.topAlbums.slice(0, PREVIEW_ROWS).map((r) => (
              <AlbumRow key={r.album.id} {...r} onPress={setDetail} />
            ))}
          </View>
          <View style={[styles.sectionRow, styles.section]}>
            {heading('artists', 'Top artists')}
            <RangePicker
              which="artists"
              value={ranges.artists}
              onChange={(n) => setRanges((r) => ({ ...r, artists: n }))}
            />
          </View>
          <View style={styles.preview}>
            {artistStats.days === 0 && <Text style={styles.rangeEmpty}>No days in this range.</Text>}
            {artistStats.topArtists.slice(0, PREVIEW_ROWS).map((r) => (
              <ArtistRow key={r.artistId} {...r} onPress={setArtist} />
            ))}
          </View>
          <Text style={[styles.label, styles.section]}>Days</Text>
        </>
      )}
    </View>
  );

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      // Android: draw the sheet under both system bars so the camera screen never shows through below it
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <FlatList
        ref={listRef}
        style={styles.sheet}
        contentContainerStyle={styles.content}
        data={days}
        keyExtractor={(k) => k}
        // Rows past the render window have no layout yet: jump near them by estimate, then land exactly
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          listRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: false });
          setTimeout(() => listRef.current?.scrollToIndex({ index, viewPosition: 0 }), 100);
        }}
        ListHeaderComponent={header}
        ListEmptyComponent={<Text style={styles.empty}>No days yet. Share a recap to start your history.</Text>}
        renderItem={({ item: key }) => (
          <View
            style={styles.day}
            accessible
            accessibilityLabel={`${formatDay(key)}: ${history[key].map((a) => `${a.title} by ${a.artist}`).join(', ')}`}
          >
            <View style={styles.dayDate}>
              <DateStamp date={toDate(key)} height={14} />
            </View>
            <View style={styles.dayCovers}>
              {history[key].map((a, i) => (
                <Image key={i} source={a.thumb} style={styles.dayThumb} />
              ))}
            </View>
          </View>
        )}
      />
      {detail && (
        <AlbumPage
          album={detail}
          history={history}
          onClose={() => setDetail(null)}
          onPickAlbum={setDetail}
          onPickDay={(key) => {
            setDetail(null);
            jumpTo(key);
          }}
        />
      )}
      {artist && (
        <ArtistPage
          artist={artist}
          history={history}
          onClose={() => setArtist(null)}
          onPickArtist={setArtist}
          onPickDay={(key) => {
            setArtist(null);
            jumpTo(key);
          }}
        />
      )}
      {full && (
        <TopList
          which={full}
          history={history}
          range={ranges[full]}
          onRangeChange={(n) => setRanges((r) => ({ ...r, [full]: n }))}
          onClose={() => setFull(null)}
          onPickDay={(key) => {
            setFull(null);
            jumpTo(key);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: color.ink,
  },
  content: {
    padding: 16,
    paddingBottom: 48,
    // Android modals draw under the status bar; iOS pageSheet already sits below it
    paddingTop: 16 + (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: color.text,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  done: {
    color: color.text,
    fontSize: 17,
    fontWeight: '600',
  },
  summary: {
    color: color.mute,
    fontSize: 15,
    marginTop: 2,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeEmpty: {
    color: color.mute,
    fontSize: 15,
  },
  // Section headings and the range picker share one label style
  label: {
    color: color.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
  },
  range: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  preview: {
    height: PREVIEW_ROWS * ROW_H,
  },
  pressed: {
    opacity: 0.7,
  },
  error: {
    color: color.imprint,
    marginTop: 8,
  },
  empty: {
    color: color.mute,
    fontSize: 15,
    marginTop: 24,
  },
  day: {
    marginBottom: 24,
  },
  dayDate: {
    marginBottom: 10,
    paddingLeft: 2,
  },
  dayCovers: {
    flexDirection: 'row',
    gap: 6,
  },
  dayThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
});
