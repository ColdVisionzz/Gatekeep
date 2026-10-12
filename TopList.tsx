import { useState } from 'react';
import { FlatList, Modal, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { lastDays, stats, type ArtistCount, type History } from './history';
import type { Album } from './albums';
import AlbumPage from './AlbumPage';
import ArtistPage from './ArtistPage';
import RangePicker from './RangePicker';
import { AlbumRow, ArtistRow } from './StatRows';
import { color } from './theme';

type Props = {
  which: 'albums' | 'artists';
  history: History;
  range: number | null;
  onRangeChange: (n: number | null) => void;
  onClose: () => void;
  onPickDay: (key: string) => void;
};

// Every recorded album or artist, ranked, with the same range picker as the History sections.
export default function TopList({ which, history, range, onRangeChange, onClose, onPickDay }: Props) {
  const [detail, setDetail] = useState<Album | null>(null);
  const [artist, setArtist] = useState<ArtistCount | null>(null);
  const s = stats(range ? lastDays(history, range) : history);
  const title = which === 'albums' ? 'Top albums' : 'Top artists';

  const header = (
    <View>
      <View style={styles.titleRow}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summary}>
          {s.days} {s.days === 1 ? 'day' : 'days'} logged
        </Text>
        <RangePicker which={which} value={range} onChange={onRangeChange} />
      </View>
    </View>
  );

  const empty = <Text style={styles.empty}>No days in this range.</Text>;
  const common = {
    style: styles.sheet,
    contentContainerStyle: styles.content,
    ListHeaderComponent: header,
    ListEmptyComponent: empty,
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {which === 'albums' ? (
        <FlatList
          {...common}
          data={s.topAlbums}
          keyExtractor={(r) => String(r.album.id)}
          renderItem={({ item }) => <AlbumRow {...item} onPress={setDetail} />}
        />
      ) : (
        <FlatList
          {...common}
          data={s.topArtists}
          keyExtractor={(r) => String(r.artistId)}
          renderItem={({ item }) => <ArtistRow {...item} onPress={setArtist} />}
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
            onPickDay(key);
          }}
        />
      )}
      {detail && (
        <AlbumPage
          album={detail}
          history={history}
          onClose={() => setDetail(null)}
          onPickAlbum={setDetail}
          onPickDay={(key) => {
            setDetail(null);
            onPickDay(key);
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 16,
  },
  summary: {
    color: color.mute,
    fontSize: 15,
  },
  empty: {
    color: color.mute,
    fontSize: 15,
  },
});
