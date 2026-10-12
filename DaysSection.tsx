import { useState } from 'react';
import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dayKey, formatDay, toDate } from './history';
import DateStamp from './DateStamp';
import { color } from './theme';

const WEEKS = 53;
const GAP = 1.5;
const GUTTER = 26; // room for the Mon / Wed / Fri labels
const MONTH_ROW = 14;
const SHADES = ['rgba(255,122,26,0.35)', 'rgba(255,122,26,0.55)', 'rgba(255,122,26,0.8)', color.imprint];

// The past year as one block of tiny squares, a column per week and a row per weekday, like a contribution graph.
// counts: day key -> how many times (albums, for an artist) that day. `shaded` turns the count into 4 shades of
// the stamp orange; without it any picked day is full orange. Tapping a lit square calls onPickDay.
// ponytail: weeks start on Sunday whatever the locale; read the locale's first weekday if that bothers anyone.
export function YearCalendar({
  counts,
  shaded = false,
  onPickDay,
}: {
  counts: Record<string, number>;
  shaded?: boolean;
  onPickDay: (key: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - (WEEKS - 1) * 7);
  const dayAt = (col: number, row: number) =>
    new Date(first.getFullYear(), first.getMonth(), first.getDate() + col * 7 + row);
  const today = dayKey(now);

  const cell = (width - GUTTER - GAP * (WEEKS - 1)) / WEEKS;
  const pitch = cell + GAP;
  const shade = (n: number) => (shaded ? SHADES[Math.min(n, 4) - 1] : color.imprint);

  // Month labels sit over the week that holds the 1st; skip any that would crowd the previous one or the edge
  const months: { col: number; text: string }[] = [];
  for (let col = 0; col < WEEKS - 3; col++) {
    for (let row = 0; row < 7; row++) {
      const d = dayAt(col, row);
      if (d.getDate() === 1 && (months.length === 0 || col - months[months.length - 1].col >= 4)) {
        months.push({ col, text: d.toLocaleDateString(undefined, { month: 'short' }) });
      }
    }
  }
  const total = Object.keys(counts).filter((k) => k >= dayKey(first) && k <= today).length;

  const onGridPress = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const col = Math.floor((locationX - GUTTER) / pitch);
    const row = Math.floor((locationY - MONTH_ROW) / pitch);
    if (col < 0 || col >= WEEKS || row < 0 || row > 6) return;
    const key = dayKey(dayAt(col, row));
    if (counts[key]) onPickDay(key);
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <>
          <Pressable
            onPress={onGridPress}
            accessibilityRole="image"
            accessibilityLabel={`Picked on ${total} ${total === 1 ? 'day' : 'days'} in the past year`}
          >
            <View style={styles.noTouch}>
              {months.map((m) => (
                <Text key={m.col} style={[styles.tick, { left: GUTTER + m.col * pitch }]}>
                  {m.text}
                </Text>
              ))}
              {['Mon', 'Wed', 'Fri'].map((name, i) => (
                <Text key={name} style={[styles.tick, styles.weekday, { top: MONTH_ROW + (1 + i * 2) * pitch - 1 }]}>
                  {name}
                </Text>
              ))}
              <View style={[styles.weeks, { marginLeft: GUTTER, marginTop: MONTH_ROW, gap: GAP }]}>
                {Array.from({ length: WEEKS }, (_, col) => (
                  <View key={col} style={{ gap: GAP }}>
                    {Array.from({ length: 7 }, (_, row) => {
                      const key = dayKey(dayAt(col, row));
                      const n = counts[key] ?? 0;
                      return (
                        <View
                          key={row}
                          style={[
                            { width: cell, height: cell },
                            key <= today && styles.square,
                            n > 0 && { backgroundColor: shade(n) },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
          {shaded && (
            <View style={styles.legend}>
              <Text style={styles.legendText}>Less</Text>
              {SHADES.map((c) => (
                <View key={c} style={[styles.square, { width: cell, height: cell, backgroundColor: c }]} />
              ))}
              <Text style={styles.legendText}>More</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// Newest-first list of days; each row jumps to that day in History.
export function DayList({ days, onPickDay }: { days: string[]; onPickDay: (key: string) => void }) {
  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: color.mute,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
  },
  // Touches go to the Pressable around the grid, which works out the square from the position
  noTouch: {
    pointerEvents: 'none',
  },
  weeks: {
    flexDirection: 'row',
  },
  square: {
    borderRadius: 1,
    backgroundColor: color.raised,
  },
  legendText: {
    color: color.mute,
    fontSize: 10,
    lineHeight: 12,
  },
  tick: {
    position: 'absolute',
    color: color.mute,
    fontSize: 10,
    lineHeight: 12,
  },
  weekday: {
    left: 0,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: 6,
  },
  sub: {
    color: color.mute,
    fontSize: 14,
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
  flex: {
    flex: 1,
  },
});
