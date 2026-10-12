import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { AlbumCount, ArtistCount } from './history';
import type { Album } from './albums';
import { color } from './theme';

// 44pt cover + 6pt padding top and bottom; a section of N rows is N * ROW_H tall
export const ROW_H = 56;

export function AlbumRow({ album, count, onPress }: AlbumCount & { onPress: (a: Album) => void }) {
  return (
    <Pressable
      onPress={() => onPress(album)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${album.title} by ${album.artist}, picked ${count} times`}
      accessibilityHint="Opens album page"
    >
      <Image source={album.thumb} style={styles.thumb} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {album.artist}
        </Text>
      </View>
      <Text style={styles.count}>×{count}</Text>
    </Pressable>
  );
}

export function ArtistRow({ name, count }: ArtistCount) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${name}, picked ${count} times`}>
      <Text style={[styles.name, styles.text]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.count}>×{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: ROW_H,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
  text: {
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
  pressed: {
    opacity: 0.7,
  },
});
