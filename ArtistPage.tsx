import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { artistDayCounts, artistDays, stats, topArtistCombos, type ArtistCount, type History } from './history';
import { artistImage, type Album } from './albums';
import AlbumPage from './AlbumPage';
import { DayList, YearCalendar } from './DaysSection';
import { AlbumRow, ArtistRow } from './StatRows';
import { color } from './theme';

type Props = {
  artist: ArtistCount;
  history: History;
  onClose: () => void;
  onPickDay: (key: string) => void;
  onPickArtist: (artist: ArtistCount) => void;
};

// One artist: when they were picked, their most picked albums and who they are picked with.
// Reads the full history, so the range picker in History never changes what this page shows.
export default function ArtistPage({ artist, history, onClose, onPickDay, onPickArtist }: Props) {
  const [detail, setDetail] = useState<Album | null>(null);
  const days = artistDays(history, artist.artistId);
  const albums = stats(history)
    .topAlbums.filter((r) => r.album.artistId === artist.artistId)
    .slice(0, 4);
  const combos = topArtistCombos(history, artist.artistId);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ScrollView style={styles.sheet} contentContainerStyle={styles.content}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={20} color={color.text} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.hero}>
          <Image source={artistImage(artist.artistId)} style={styles.picture} />
          <View style={styles.heroText}>
            <Text style={styles.title} numberOfLines={3}>
              {artist.name}
            </Text>
            <Text style={styles.sub}>
              Picked on {days.length} {days.length === 1 ? 'day' : 'days'}
            </Text>
          </View>
        </View>

        <Text style={[styles.label, styles.section]}>Past year</Text>
        <YearCalendar counts={artistDayCounts(history, artist.artistId)} shaded onPickDay={onPickDay} />

        <Text style={[styles.label, styles.section]}>Top albums</Text>
        {albums.map((r) => (
          <AlbumRow key={r.album.id} {...r} onPress={setDetail} />
        ))}

        {combos.length > 0 && (
          <>
            <Text style={[styles.label, styles.section]}>Picked with</Text>
            {combos.map((r) => (
              <ArtistRow key={r.artistId} {...r} onPress={onPickArtist} />
            ))}
          </>
        )}

        <DayList days={days} onPickDay={onPickDay} />
      </ScrollView>
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
  picture: {
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
});
