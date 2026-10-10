import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { stats, type History as HistoryData } from './history';
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

// Mounted only while open, so it rereads history.json each time (picks up today's export).
export default function History({ onClose }: Props) {
  const [{ history, error }] = useState(() => {
    try {
      return { history: loadHistory(), error: null };
    } catch (e) {
      return { history: {} as HistoryData, error: String(e) };
    }
  });
  const s = stats(history);
  const days = Object.keys(history).sort().reverse();

  const header = (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>History</Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
      {error && <Text style={styles.error}>Could not read history: {error}</Text>}
      {s.days > 0 && (
        <>
          <Text style={styles.summary}>
            {s.days} {s.days === 1 ? 'day' : 'days'} logged
          </Text>
          <Text style={styles.section}>Top albums</Text>
          {s.topAlbums.slice(0, 10).map(({ album, count }) => (
            <View
              key={album.id}
              style={styles.statRow}
              accessible
              accessibilityLabel={`${album.title} by ${album.artist}, picked ${count} times`}
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
            </View>
          ))}
          <Text style={styles.section}>Top artists</Text>
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
        style={styles.sheet}
        contentContainerStyle={styles.content}
        data={days}
        keyExtractor={(k) => k}
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
