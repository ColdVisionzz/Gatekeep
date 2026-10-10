import { Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { albumDays, dayKey, formatDay, toDate, topCombos, type History } from './history';
import type { Album } from './albums';
import DateStamp from './DateStamp';
import { color } from './theme';

type Props = {
  album: Album;
  history: History;
  onClose: () => void;
  onPickDay: (key: string) => void;
  onPickAlbum: (album: Album) => void;
};

// One album: when it was picked (calendar and list) and what it is picked with.
// Reads the full history, so the range picker in History never changes what this page shows.
export default function AlbumPage({ album, history, onClose, onPickDay, onPickAlbum }: Props) {
  const days = albumDays(history, album.id);
  const combos = topCombos(history, album.id);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back to history">
          <Ionicons name="chevron-back" size={20} color={color.text} />
          <Text style={styles.backText}>History</Text>
        </Pressable>

        <View style={styles.hero}>
          <Image source={album.thumb} style={styles.cover} />
          <View style={styles.heroText}>
            <Text style={styles.title} numberOfLines={3}>
              {album.title}
            </Text>
            <Text style={styles.sub} numberOfLines={1}>
              {album.artist}
            </Text>
            <Text style={styles.sub}>
              Picked {days.length} {days.length === 1 ? 'time' : 'times'}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, styles.section]}>Past year</Text>
        <YearCalendar picked={new Set(days)} onPickDay={onPickDay} />

        {combos.length > 0 && (
          <>
            <Text style={[styles.label, styles.section]}>Paired with</Text>
            {combos.map(({ album: a, count }) => (
              <Pressable
                key={a.id}
                onPress={() => onPickAlbum(a)}
                style={({ pressed }) => [styles.statRow, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${a.title} by ${a.artist}, picked together ${count} times`}
                accessibilityHint="Opens album page"
              >
                <Image source={a.thumb} style={styles.statThumb} />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>
                    {a.title}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {a.artist}
                  </Text>
                </View>
                <Text style={styles.count}>×{count}</Text>
              </Pressable>
            ))}
          </>
        )}

        <Text style={[styles.label, styles.section]}>Days</Text>
        {days.map((key, i) => (
          <Pressable
            key={key}
            onPress={() => onPickDay(key)}
            style={({ pressed }) => [styles.dayRow, i > 0 && styles.divider, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={formatDay(key)}
            accessibilityHint="Shows this day in history"
          >
            <DateStamp date={toDate(key)} height={14} />
            <Text style={[styles.sub, styles.flex]} numberOfLines={1}>
              {toDate(key).toLocaleDateString(undefined, { weekday: 'long' })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={color.mute} />
          </Pressable>
        ))}
      </ScrollView>
    </Modal>
  );
}

// The last 12 months, this month first, as small month grids. Days the album was picked light up in the stamp orange.
// ponytail: weeks start on Sunday whatever the locale; read the locale's first weekday if that bothers anyone.
function YearCalendar({ picked, onPickDay }: { picked: Set<string>; onPickDay: (key: string) => void }) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - i, 1));

  return (
    <View style={styles.months}>
      {months.map((first) => {
        const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        // Stop at today in the current month
        const count = first.getMonth() === now.getMonth() && first.getFullYear() === now.getFullYear() ? now.getDate() : last;
        return (
          <View key={dayKey(first)} style={styles.month}>
            <Text style={styles.label}>
              {first.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </Text>
            <View style={styles.grid}>
              {Array.from({ length: first.getDay() }, (_, i) => (
                <View key={`pad${i}`} style={styles.cell} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const key = dayKey(new Date(first.getFullYear(), first.getMonth(), i + 1));
                return picked.has(key) ? (
                  <Pressable
                    key={key}
                    style={styles.cell}
                    hitSlop={4}
                    onPress={() => onPickDay(key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDay(key)}, picked`}
                    accessibilityHint="Shows this day in history"
                  >
                    <View style={[styles.dot, styles.on]} />
                  </Pressable>
                ) : (
                  <View key={key} style={styles.cell}>
                    <View style={styles.dot} />
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
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
  flex: {
    flex: 1,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    marginLeft: -4,
  },
  backText: {
    color: color.text,
    fontSize: 17,
    fontWeight: '600',
  },
  hero: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  cover: {
    width: 96,
    height: 96,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: color.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sub: {
    color: color.mute,
    fontSize: 14,
  },
  label: {
    color: color.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
  },
  months: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  month: {
    width: '47%',
    gap: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Seven to a row; the padding in `cell` is the gap between dots
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 1.5,
  },
  dot: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
  on: {
    backgroundColor: color.imprint,
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
  name: {
    color: color.text,
    fontSize: 16,
    fontWeight: '500',
  },
  count: {
    color: color.text,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 48,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.line,
  },
  pressed: {
    opacity: 0.7,
  },
});
