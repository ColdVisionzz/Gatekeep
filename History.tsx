import { useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { lastDays, stats, type History as HistoryData } from './history';
import { loadHistory } from './historyStore';
import DateStamp from './DateStamp';
import { color } from './theme';

type Props = { onClose: () => void };

// "2026-01-05" -> local date. new Date("2026-01-05") would parse as UTC and can land on the previous day.
function toDate(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
const formatDay = (key: string) => toDate(key).toLocaleDateString(undefined, { dateStyle: 'long' });

const RANGES: [number | null, string][] = [
  [null, 'All time'],
  [7, '7 days'],
  [14, '14 days'],
  [30, '30 days'],
  [90, '90 days'],
  [180, '180 days'],
  [360, '360 days'],
];
// Popup height: one 44pt row per range plus 4pt padding top and bottom
const MENU_HEIGHT = RANGES.length * 44 + 8;

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
  // Which picker the range popup belongs to and where it sits, measured from that picker; null while closed
  const [menu, setMenu] = useState<{ which: Section; pos: { right: number; top: number } } | null>(null);
  const pickerRefs = { albums: useRef<View>(null), artists: useRef<View>(null) };
  const win = useWindowDimensions();
  const [openAlbum, setOpenAlbum] = useState<number | null>(null);
  const listRef = useRef<FlatList<string>>(null);
  // Stats follow the range; the day list below always shows every day, so a jump always has a row to land on
  const statsFor = (n: number | null) => stats(n ? lastDays(history, n) : history);
  const s = statsFor(ranges.albums);
  const artistStats = statsFor(ranges.artists);
  const days = Object.keys(history).sort().reverse();

  function openRange(which: Section) {
    pickerRefs[which].current?.measureInWindow((x, y, w, h) => {
      // Opens below unless that runs off screen; the artists picker can sit low when the list is unscrolled
      const below = y + h + 6;
      const top = below + MENU_HEIGHT > win.height ? Math.max(8, y - 6 - MENU_HEIGHT) : below;
      setMenu({ which, pos: { right: win.width - (x + w), top } });
    });
  }

  const picker = (which: Section) => {
    const label = RANGES.find(([n]) => n === ranges[which])![1];
    return (
      <Pressable
        ref={pickerRefs[which]}
        onPress={() => openRange(which)}
        hitSlop={12}
        style={({ pressed }) => [styles.range, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Top ${which} time range: ${label}`}
        accessibilityHint="Opens a menu of time ranges"
        accessibilityState={{ expanded: menu?.which === which }}
      >
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="chevron-down" size={13} color={color.mute} />
      </Pressable>
    );
  };

  const jumpTo = (key: string) => listRef.current?.scrollToIndex({ index: days.indexOf(key), viewPosition: 0 });

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
            <Text style={styles.label}>Top albums</Text>
            {picker('albums')}
          </View>
          {s.days === 0 && <Text style={styles.rangeEmpty}>No days in this range.</Text>}
          {s.topAlbums.slice(0, 10).map(({ album, count, days: used }) => (
            <View key={album.id}>
              <Pressable
                onPress={() => setOpenAlbum((id) => (id === album.id ? null : album.id))}
                style={({ pressed }) => [styles.statRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${album.title} by ${album.artist}, picked ${count} times`}
                accessibilityHint="Shows the days you picked it"
                accessibilityState={{ expanded: openAlbum === album.id }}
              >
                <Image source={album.thumb} style={styles.statThumb} />
                <View style={styles.statText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {album.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {album.artist}
                  </Text>
                </View>
                <Text style={styles.count}>×{count}</Text>
              </Pressable>
              {openAlbum === album.id && (
                <View style={styles.used}>
                  {used.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => jumpTo(key)}
                      style={({ pressed }) => [styles.usedDay, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityHint="Scrolls to this day"
                    >
                      <Text style={styles.usedText}>{formatDay(key)}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}
          <View style={[styles.sectionRow, styles.section]}>
            <Text style={styles.label}>Top artists</Text>
            {picker('artists')}
          </View>
          {artistStats.days === 0 && <Text style={styles.rangeEmpty}>No days in this range.</Text>}
          {artistStats.topArtists.slice(0, 10).map(({ artistId, name, count }) => (
            <View
              key={artistId}
              style={styles.statRow}
              accessible
              accessibilityLabel={`${name}, picked ${count} times`}
            >
              <Text style={[styles.name, styles.statText]} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.count}>×{count}</Text>
            </View>
          ))}
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
      {/* A popup, not an inline list, so picking a range never pushes the stats down */}
      <Modal
        visible={!!menu}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setMenu(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setMenu(null)} accessibilityLabel="Close menu" />
        {menu && (
          <View style={[styles.menu, menu.pos]} accessibilityViewIsModal>
            {RANGES.map(([n, label], i) => {
              const on = n === ranges[menu.which];
              return (
                <Pressable
                  key={label}
                  onPress={() => {
                    setRanges((r) => ({ ...r, [menu.which]: n }));
                    setMenu(null);
                  }}
                  style={({ pressed }) => [styles.menuItem, i > 0 && styles.menuDivider, pressed && styles.menuPressed]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.menuText, on && styles.menuTextOn]}>{label}</Text>
                  {on && <Ionicons name="checkmark" size={17} color={color.text} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
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
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  statThumb: {
    width: 44,
    height: 44,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
  statText: {
    flex: 1,
  },
  name: {
    color: color.text,
    fontSize: 16,
    fontWeight: '500',
  },
  sub: {
    color: color.mute,
    fontSize: 14,
  },
  count: {
    color: color.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  range: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menu: {
    position: 'absolute',
    minWidth: 200,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: color.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.line,
    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    height: 44,
  },
  menuDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  menuPressed: {
    backgroundColor: color.line,
  },
  menuText: {
    color: color.mute,
    fontSize: 16,
  },
  menuTextOn: {
    color: color.text,
    fontWeight: '600',
  },
  used: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 56,
    paddingBottom: 10,
  },
  usedDay: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: color.raised,
  },
  usedText: {
    color: color.text,
    fontSize: 14,
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
