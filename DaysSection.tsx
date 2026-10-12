import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { dayKey, formatDay, toDate } from './history';
import DateStamp from './DateStamp';
import { color } from './theme';

// The last 12 months, this month first, as small month grids. Days the album was picked light up in the stamp orange.
// ponytail: weeks start on Sunday whatever the locale; read the locale's first weekday if that bothers anyone.
export function YearCalendar({ picked, onPickDay }: { picked: Set<string>; onPickDay: (key: string) => void }) {
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
