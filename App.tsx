import { useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Album } from './albums';
import AlbumSearch from './AlbumSearch';
import DateStamp from './DateStamp';
import History from './History';
import { dayKey } from './history';
import { saveDay } from './historyStore';
import { color } from './theme';

const BAR = 112; // height of the control bar under the frame

export default function App() {
  return (
    <SafeAreaProvider>
      <Recap />
    </SafeAreaProvider>
  );
}

function Recap() {
  const recapRef = useRef<View>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shooting, setShooting] = useState(false);
  const [albums, setAlbums] = useState<(Album | null)[]>([null, null, null, null]);
  const [searchSlot, setSearchSlot] = useState<number | null>(null);
  // Bumped on every pick so the slot's Image remounts, which retries a cover that failed to load
  const [slotKeys, setSlotKeys] = useState([0, 0, 0, 0]);
  const [showHistory, setShowHistory] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  // Load status keyed by image URI (covers and photo), so swapping an image never reuses a stale status
  const [loadStatus, setLoadStatus] = useState<Record<string, 'ok' | 'error'>>({});
  const markLoaded = (uri: string, status: 'ok' | 'error') => setLoadStatus((s) => ({ ...s, [uri]: status }));
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Ask on first launch; after a denial the frame shows a button instead
  useEffect(() => {
    if (permission?.status === 'undetermined' && permission.canAskAgain) requestPermission();
  }, [permission, requestPermission]);

  // One 9:16 frame for the live preview, the still and the export, so what you frame is what you post
  const frameW = Math.min(width - 16, ((height - insets.top - insets.bottom - BAR - 8) * 9) / 16);
  const pad = frameW * 0.05;
  const gap = frameW * 0.025;
  const coverW = Math.floor((frameW - pad * 2 - gap * 3) / 4); // floor so pixel rounding never wraps the row
  const missing = albums.filter((a) => !a).length;
  const uris = [photoUri, ...albums.map((a) => a?.cover)].filter((u): u is string => !!u);
  const failed = uris.some((u) => loadStatus[u] === 'error');
  // The live preview can't be captured (it exports black), so sharing waits for a still
  const ready = !!photoUri && missing === 0 && uris.every((u) => loadStatus[u] === 'ok');
  const today = new Date();

  async function shoot() {
    if (!cameraRef.current || shooting) return;
    setShooting(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      setPhotoUri(pic.uri);
    } catch (e) {
      Alert.alert('Photo failed', String(e));
    } finally {
      setShooting(false);
    }
  }

  function retake() {
    setPhotoUri(null);
    setCameraReady(false);
  }

  async function share() {
    try {
      // ponytail: view-shot scales the on-screen view to 1080x1920; on low-density screens this upscales. Render offscreen at full size if exports look soft.
      const uri = await captureRef(recapRef, { format: 'png', width: 1080, height: 1920 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png' });
    } catch (e) {
      Alert.alert('Share failed', String(e));
      return;
    }
    // ponytail: shareAsync also resolves when the share sheet is dismissed (Android reports no result), so closing the sheet still saves the day
    try {
      saveDay(dayKey(new Date()), albums as Album[]);
    } catch (e) {
      Alert.alert('Could not save to history', String(e));
    }
  }

  function viewfinder() {
    if (!permission) return null;
    if (!permission.granted) {
      return (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Camera access is off</Text>
          <Text style={styles.noticeBody}>Your recap starts with a photo of today.</Text>
          <Pressable
            onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
            style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.pillText}>{permission.canAskAgain ? 'Allow camera' : 'Open Settings'}</Text>
          </Pressable>
        </View>
      );
    }
    if (cameraError) {
      // e.g. iOS Simulator, which has no camera
      return (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Camera unavailable</Text>
          <Text style={styles.noticeBody}>{cameraError}</Text>
        </View>
      );
    }
    return (
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mirror // front-camera stills come out the way the preview showed them
        onCameraReady={() => setCameraReady(true)}
        onMountError={(e) => setCameraError(e.message)}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
      <View style={[styles.frame, { width: frameW }]}>
        {/* collapsable={false}: Android drops plain Views from the native tree, so captureRef needs this */}
        <View ref={recapRef} collapsable={false} style={styles.recap}>
          {photoUri ? (
            <Image
              source={photoUri}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              accessibilityLabel="Your photo"
              onLoad={() => markLoaded(photoUri, 'ok')}
              onError={() => markLoaded(photoUri, 'error')}
            />
          ) : (
            viewfinder()
          )}
          <View style={[styles.overlay, { left: pad, right: pad, bottom: pad, gap: gap * 1.6 }]}>
            <DateStamp date={today} height={frameW * 0.05} />
            <View style={[styles.dock, { gap }]}>
              {albums.map((album, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSearchSlot(i)}
                  style={({ pressed }) => [
                    styles.slot,
                    album ? styles.slotFilled : styles.slotEmpty,
                    { width: coverW, height: coverW },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Album ${i + 1}, ${album ? `${album.title} by ${album.artist}` : 'empty'}`}
                >
                  {album ? (
                    <>
                      <Image
                        key={slotKeys[i]}
                        source={album.cover}
                        style={styles.fill}
                        contentFit="cover"
                        onLoad={() => markLoaded(album.cover, 'ok')}
                        onError={() => markLoaded(album.cover, 'error')}
                      />
                      {loadStatus[album.cover] === 'error' && (
                        <Ionicons name="refresh" size={coverW * 0.34} color={color.text} style={styles.retry} />
                      )}
                    </>
                  ) : (
                    <Ionicons name="add" size={coverW * 0.34} color={color.text} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bar}>
        <RoundButton icon="calendar-clear-outline" label="History" onPress={() => setShowHistory(true)} />
        <View style={styles.barCenter}>
          {photoUri ? (
            <Pressable
              key="share" // distinct keys: Android keeps a stale accessibilityLabel when the shutter Pressable is reused
              onPress={share}
              disabled={!ready}
              style={({ pressed }) => [styles.pill, !ready && styles.pillOff, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ready }}
            >
              <Text style={[styles.pillText, !ready && styles.pillTextOff]}>
                {missing > 0
                  ? `Add ${missing} more ${missing === 1 ? 'album' : 'albums'}`
                  : failed
                    ? "Cover didn't load"
                    : ready
                      ? 'Share'
                      : 'Loading…'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              key="shutter"
              onPress={shoot}
              disabled={!cameraReady || shooting}
              style={({ pressed }) => [styles.shutter, (!cameraReady || shooting) && styles.off, pressed && styles.shutterDown]}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              accessibilityState={{ disabled: !cameraReady || shooting }}
            >
              <View style={styles.shutterCore} />
            </Pressable>
          )}
        </View>
        {photoUri ? (
          <RoundButton icon="refresh" label="Retake" onPress={retake} />
        ) : (
          <RoundButton
            icon="camera-reverse-outline"
            label="Switch camera"
            disabled={!cameraReady}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          />
        )}
      </View>

      {searchSlot !== null && (
        <AlbumSearch
          onPick={(album) => {
            setAlbums((list) => list.map((a, j) => (j === searchSlot ? album : a)));
            setSlotKeys((keys) => keys.map((k, j) => (j === searchSlot ? k + 1 : k)));
            setLoadStatus(({ [album.cover]: _, ...rest }) => rest);
            setSearchSlot(null);
          }}
          onClose={() => setSearchSlot(null)}
        />
      )}
      {showHistory && <History onClose={() => setShowHistory(false)} />}
      <StatusBar style="light" />
    </View>
  );
}

type RoundButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

function RoundButton({ icon, label, onPress, disabled }: RoundButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.round, disabled && styles.off, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
    >
      <Ionicons name={icon} size={24} color={color.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.ink,
    alignItems: 'center',
  },
  // Rounded on screen only: the clip sits outside the captured view, so the PNG keeps square corners
  frame: {
    aspectRatio: 9 / 16,
    borderRadius: 22,
    overflow: 'hidden',
  },
  recap: {
    flex: 1,
    backgroundColor: color.raised,
  },
  overlay: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  dock: {
    flexDirection: 'row',
  },
  // Sleeves have square corners; covers keep a 2px radius so edges don't alias
  slot: {
    borderRadius: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  slotFilled: {
    borderColor: 'rgba(255,255,255,0.22)',
    boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
  },
  slotEmpty: {
    backgroundColor: 'rgba(12,12,14,0.4)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  retry: {
    position: 'absolute',
  },
  notice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  noticeTitle: {
    color: color.text,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  noticeBody: {
    color: color.mute,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  bar: {
    height: BAR,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  barCenter: {
    flex: 1,
    alignItems: 'center',
  },
  round: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: color.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: color.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: color.text,
  },
  shutterDown: {
    transform: [{ scale: 0.92 }],
  },
  pill: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: color.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillOff: {
    backgroundColor: color.raised,
  },
  pillText: {
    color: color.ink,
    fontSize: 17,
    fontWeight: '600',
  },
  pillTextOff: {
    color: color.mute,
  },
  pressed: {
    opacity: 0.7,
  },
  off: {
    opacity: 0.35,
  },
});
