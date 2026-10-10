import { useRef, useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
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
  [7, 'Past 7 days'],
  [14, 'Past 14 days'],
  [30, 'Past 30 days'],
  [90, 'Past 90 days'],
  [180, 'Past 180 days'],
  [360, 'Past 360 days'],
];

// Mounted only while open, so it rereads history.json each time (picks up today's export).
export default function History({ onClose }: Props) {
  const [{ history, error }] = useState(() => {
    try {
      return { history: loadHistory(), error: null };
    } catch (e) {
      return { history: {} as HistoryData, error: String(e) };
    }
  });
  const [range, setRange] = useState<number | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [openAlbum, setOpenAlbum] = useState<number | null>(null);
  const listRef = useRef<FlatList<string>>(null);
  // Stats follow the range; the day list below always shows every day, so a jump always has a row to land on
  const s = stats(range ? lastDays(history, range) : history);
  const days = Object.keys(history).sort().reverse();
  const rangeLabel = RANGES.find(([n]) => n === range)![1];

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
          {/* Inline, not an overlay: an absolute menu inside a FlatList header gets clipped on Android */}
          <Pressable
            onPress={() => setRangeOpen((o) => !o)}
            style={({ pressed }) => [styles.range, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Time range: ${rangeLabel}`}
            accessibilityState={{ expanded: rangeOpen }}
          >
            <Text style={styles.rangeText}>{rangeLabel}</Text>
            <Ionicons name={rangeOpen ? 'chevron-up' : 'chevron-down'} size={16} color={color.text} />
          </Pressable>
          {rangeOpen && (
            <View style={styles.menu}>
              {RANGES.map(([n, label]) => (
                <Pressable
                  key={label}
                  onPress={() => {
                    setRange(n);
                    setRangeOpen(false);
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: n === range }}
                >
                  <Text style={[styles.menuText, n === range && styles.menuTextOn]}>{label}</Text>
                  {n === range && <Ionicons name="checkmark" size={18} color={color.text} />}
                </Pressable>
              ))}
            </View>
          )}
          {s.days === 0 && <Text style={styles.empty}>No days in this range.</Text>}
          {s.days > 0 && <Text style={styles.section}>Top albums</Text>}
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
          {s.days > 0 && <Text style={styles.section}>Top artists</Text>}
          {s.topArtists.slice(0, 10).map(({ artistId, name, count }) => (
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
          <Text style={styles.section}>Days</Text>
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
  section: {
    color: color.mute,
    fontSize: 13,
    fontWeight: '600',
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
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 16,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: color.raised,
  },
  rangeText: {
    color: color.text,
    fontSize: 15,
    fontWeight: '600',
  },
  menu: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: color.raised,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.line,
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
