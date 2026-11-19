import { StyleSheet, Text, View } from 'react-native';
import { ITEM_DROP_RARITY_WEIGHTS, RARITY_LABEL } from '../../data/items';
import type { Rarity } from '../../core/types';
import { luckProbabilities } from '../../minigames/luckGame';
import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import { COLORS, FONT, SPACE } from '../theme';

const formatPercent = (p: number) => (p >= 1 ? `${p.toFixed(1)}%` : `${p.toFixed(3)}%`);

/** 運試しの確率表（抽選表 data/luckTable.ts から自動で作る） */
export function LuckOddsScreen() {
  const rarityTotal = Object.values(ITEM_DROP_RARITY_WEIGHTS).reduce((s, w) => s + w, 0);
  return (
    <Screen title="運試しの確率">
      <Card>
        {luckProbabilities().map(({ entry, percent }) => (
          <View key={entry.id} style={styles.row}>
            <Text style={styles.label}>{entry.label}</Text>
            <Text style={styles.value}>{formatPercent(percent)}</Text>
          </View>
        ))}
      </Card>
      <Text style={styles.heading}>「アイテム」が出たときのレア度</Text>
      <Card>
        {(Object.keys(ITEM_DROP_RARITY_WEIGHTS) as Rarity[]).map((r) => (
          <View key={r} style={styles.row}>
            <Text style={styles.label}>{RARITY_LABEL[r]}</Text>
            <Text style={styles.value}>{formatPercent((ITEM_DROP_RARITY_WEIGHTS[r] / rarityTotal) * 100)}</Text>
          </View>
        ))}
      </Card>
      <Text style={styles.note}>
        結果は、演出の前にこの確率で決まります。演出で結果が変わることはありません。{'\n'}
        ゲーム内のお金は現実のお金ではなく、換金もできません。
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F0E8DC' },
  label: { fontSize: FONT.body, color: COLORS.ink },
  value: { fontSize: FONT.body, fontWeight: '800', color: COLORS.ink },
  heading: { fontSize: FONT.body, fontWeight: '800', color: COLORS.ink, marginTop: SPACE.s },
  note: { fontSize: FONT.small, color: COLORS.subInk, lineHeight: 20 },
});
