import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { color } from './theme';

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

type Props = { which: 'albums' | 'artists'; value: number | null; onChange: (n: number | null) => void };

// Time-range dropdown. Owns its popup, so it works inside any modal.
export default function RangePicker({ which, value, onChange }: Props) {
  // Where the popup sits, measured from the picker; null while closed
  const [pos, setPos] = useState<{ right: number; top: number } | null>(null);
  const ref = useRef<View>(null);
  const win = useWindowDimensions();
  const label = RANGES.find(([n]) => n === value)![1];

  function open() {
    ref.current?.measureInWindow((x, y, w, h) => {
      // Opens below unless that runs off screen
      const below = y + h + 6;
      const top = below + MENU_HEIGHT > win.height ? Math.max(8, y - 6 - MENU_HEIGHT) : below;
      setPos({ right: win.width - (x + w), top });
    });
  }

  return (
    <>
      <Pressable
        ref={ref}
        onPress={open}
        hitSlop={12}
        style={({ pressed }) => [styles.range, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Top ${which} time range: ${label}`}
        accessibilityHint="Opens a menu of time ranges"
        accessibilityState={{ expanded: !!pos }}
      >
        <Text style={styles.label}>{label}</Text>
        <Ionicons name="chevron-down" size={13} color={color.mute} />
      </Pressable>
      {/* A popup, not an inline list, so picking a range never pushes the stats down */}
      <Modal
        visible={!!pos}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setPos(null)}
      >
        <Pressable style={styles.scrim} onPress={() => setPos(null)} accessibilityLabel="Close menu" />
        {pos && (
          <View style={[styles.menu, pos]} accessibilityViewIsModal>
            {RANGES.map(([n, text], i) => {
              const on = n === value;
              return (
                <Pressable
                  key={text}
                  onPress={() => {
                    onChange(n);
                    setPos(null);
                  }}
                  style={({ pressed }) => [styles.menuItem, i > 0 && styles.menuDivider, pressed && styles.menuPressed]}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.menuText, on && styles.menuTextOn]}>{text}</Text>
                  {on && <Ionicons name="checkmark" size={17} color={color.text} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  range: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: color.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
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
});
