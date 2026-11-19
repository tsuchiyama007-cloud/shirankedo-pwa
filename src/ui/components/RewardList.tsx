import { StyleSheet, Text, View } from 'react-native';
import { formatYenDelta } from '../../core/format';
import type { RewardSummary } from '../../core/rewards';
import { COLORS, FONT, SPACE } from '../theme';
import { NewBadge } from './NewBadge';

/** 報酬（お金・アイテム・経験値）の一覧表示 */
export function RewardList({ summary }: { summary: RewardSummary }) {
  return (
    <View style={styles.list}>
      {summary.moneyDelta !== 0 ? (
        <Text style={[styles.line, { color: summary.moneyDelta > 0 ? COLORS.success : COLORS.danger }]}>
          💰 {formatYenDelta(summary.moneyDelta)}
        </Text>
      ) : null}
      {summary.items.map(({ item, isNew }, i) => (
        <View key={`${item.id}-${i}`} style={styles.row}>
          <Text style={styles.line}>
            {item.icon} {item.name} を手に入れた
          </Text>
          {isNew ? <NewBadge /> : null}
        </View>
      ))}
      {summary.experience > 0 ? <Text style={styles.sub}>経験値 +{summary.experience}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACE.s, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap', justifyContent: 'center' },
  line: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  sub: { fontSize: FONT.body, color: COLORS.subInk },
});
