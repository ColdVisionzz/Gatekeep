import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Album, searchAlbums } from './albums';
import { color } from './theme';

type Props = {
  onPick: (album: Album) => void;
  onClose: () => void;
};

// Mounted only while open, so the query resets on every open.
export default function AlbumSearch({ onPick, onClose }: Props) {
  const [q, setQ] = useState('');
  // The last finished search, tagged with its term so loading/empty/error states derive from it
  const [res, setRes] = useState<{ term: string; albums: Album[]; error: string | null } | null>(null);
  const term = q.trim();
  const [attempt, setAttempt] = useState(0); // bumped to retry the same term after an error

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      searchAlbums(term, ctrl.signal)
        .then((albums) => setRes({ term, albums, error: null }))
        .catch((e) => {
          if (e.name !== 'AbortError') setRes({ term, albums: [], error: e.message });
        });
    }, 300);
    // Aborting on every keystroke means a stale response can never land after a newer one
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [term, attempt]);

  const tooShort = term.length < 2;
  const current = res?.term === term;
  // Keep showing the previous results while the next search runs, so the list does not flash
  const results = tooShort ? [] : (res?.albums ?? []);
  const failed = current && !!res.error;
  const message = tooShort
    ? null
    : !current
      ? 'Searching…'
      : res.error ?? (res.albums.length === 0 ? `No albums found for "${term}"` : null);

  return (
    <Modal
      animationType="slide"
      presentationStyle="pageSheet"
      // Android: draw the sheet under both system bars so the camera screen never shows through below it
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View style={styles.field}>
            <Ionicons name="search" size={18} color={color.mute} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Album or artist"
              placeholderTextColor={color.mute}
              selectionColor={color.imprint}
              accessibilityLabel="Search albums"
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              style={styles.input}
            />
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
        {message &&
          (failed ? (
            <Pressable onPress={() => setAttempt((n) => n + 1)} accessibilityRole="button" accessibilityHint="Retries the search">
              <Text style={[styles.message, styles.error]} accessibilityLiveRegion="polite">
                {message} Tap to retry.
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.message} accessibilityLiveRegion="polite">
              {message}
            </Text>
          ))}
        <FlatList
          data={results}
          keyExtractor={(a) => String(a.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(item)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title} by ${item.artist}`}
            >
              <Image source={item.thumb} style={styles.thumb} />
              <View style={styles.rowText}>
                <Text style={styles.title} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.artist} numberOfLines={1}>
                  {item.artist}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: color.ink,
    // Android modals draw under the status bar; iOS pageSheet already sits below it
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: color.raised,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: color.text,
    paddingVertical: 12,
    fontSize: 17,
  },
  cancel: {
    color: color.text,
    fontSize: 17,
  },
  message: {
    color: color.mute,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  error: {
    color: color.imprint,
  },
  list: {
    paddingBottom: 48, // clears the Android navigation bar
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowPressed: {
    backgroundColor: color.raised,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 2,
    backgroundColor: color.raised,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: color.text,
    fontSize: 16,
    fontWeight: '600',
  },
  artist: {
    color: color.mute,
    fontSize: 14,
  },
});
