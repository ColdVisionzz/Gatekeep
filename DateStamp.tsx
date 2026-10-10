import { View, type ViewStyle } from 'react-native';
import { color } from './theme';

// Lit segments per digit: a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle
const DIGITS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];

type Props = { date: Date; height: number };

// The date as a film camera printed it into the corner of the photo: '26 10 10 in orange LED segments.
// Year first, so the order reads the same in every locale. Drawn with Views, not a font, so it stays sharp at export size.
export default function DateStamp({ date, height: h }: Props) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const groups = [String(date.getFullYear()).slice(2), pad(date.getMonth() + 1), pad(date.getDate())];
  const t = h * 0.13; // segment thickness
  const w = h * 0.56; // digit width
  const glow = `0 0 ${t * 1.4}px rgba(255,122,26,0.6)`;
  const seg: ViewStyle = { position: 'absolute', backgroundColor: color.imprint, borderRadius: t / 2, boxShadow: glow };

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={date.toLocaleDateString(undefined, { dateStyle: 'long' })}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: w * 0.6, transform: [{ skewX: '-8deg' }] }}
    >
      {groups.map((g, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: w * 0.28 }}>
          {/* The apostrophe in front of the year */}
          {i === 0 && <View style={{ width: t, height: h * 0.3, marginRight: w * 0.1, ...seg, position: 'relative' }} />}
          {[...g].map((d, j) => (
            <Digit key={j} lit={DIGITS[Number(d)]} w={w} h={h} t={t} seg={seg} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Digit({ lit, w, h, t, seg }: { lit: string; w: number; h: number; t: number; seg: ViewStyle }) {
  const m = h / 2;
  const across = { left: t * 0.7, width: w - t * 1.4, height: t };
  const upright = { width: t, height: m - t * 0.85 };
  const shapes: Record<string, ViewStyle> = {
    a: { ...across, top: 0 },
    g: { ...across, top: m - t / 2 },
    d: { ...across, top: h - t },
    f: { ...upright, left: 0, top: t * 0.7 },
    b: { ...upright, left: w - t, top: t * 0.7 },
    e: { ...upright, left: 0, top: m + t * 0.15 },
    c: { ...upright, left: w - t, top: m + t * 0.15 },
  };
  return (
    <View style={{ width: w, height: h }}>
      {[...lit].map((s) => (
        <View key={s} style={[seg, shapes[s]]} />
      ))}
    </View>
  );
}
