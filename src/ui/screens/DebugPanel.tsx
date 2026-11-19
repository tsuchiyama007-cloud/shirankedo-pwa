import { StyleSheet, Text, View } from 'react-native';
import { addMoney } from '../../currency/currencyManager';
import { discoverEvent, discoverItem } from '../../collection/collectionManager';
import { useGame } from '../../core/GameManager';
import { emptySummary } from '../../core/rewards';
import { addExperience } from '../../player/playerLevelSystem';
import { addItem } from '../../items/inventoryManager';
import { getAllItems } from '../../items/itemManager';
import { getAllEvents } from '../../events/eventManager';
import type { PlayerData } from '../../core/types';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { useNavigation } from '../navigation';
import { COLORS, FONT, SPACE } from '../theme';

/**
 * 開発用のデバッグ機能。__DEV__ のときだけ設定画面に表示される（リリース版には出ない）。
 */
export function DebugPanel() {
  const game = useGame();
  const nav = useNavigation();

  const apply = (change: (p: PlayerData) => PlayerData, levelUp = false) =>
    game.runExclusive(async () => {
      if (!game.player) return;
      const before = game.player;
      const after = change(before);
      const summary = { ...emptySummary(), levelsGained: levelUp ? after.level - before.level : 0 };
      await game.commit(after, summary);
    });

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>🛠 デバッグ（開発中のみ）</Text>
      <View style={styles.grid}>
        <AppButton label="+10,000円" variant="plain" onPress={() => apply((p) => addMoney(p, 10000, 'debug'))} />
        <AppButton label="所持金を99円に" variant="plain" onPress={() => apply((p) => ({ ...p, money: 99 }))} />
        <AppButton label="経験値 +500" variant="plain" onPress={() => apply((p) => addExperience(p, 500).player, true)} />
        <AppButton label="アイテム全種類 +1" variant="plain" onPress={() => apply((p) => getAllItems().reduce((acc, i) => addItem(acc, i.id), p))} />
        <AppButton
          label="図鑑を全開放"
          variant="plain"
          onPress={() =>
            apply((p) => {
              let next = getAllEvents().reduce((acc, e) => discoverEvent(acc, e.id).player, p);
              next = getAllItems().reduce((acc, i) => discoverItem(acc, i.id).player, next);
              return next;
            })
          }
        />
        <AppButton label="今日の回数制限をリセット" variant="plain" onPress={() => apply((p) => ({ ...p, randomEventCounter: null, dailyMessage: null }))} />
        <AppButton label="特殊イベントを発生" variant="plain" onPress={() => nav.navigate('RandomEvent', { specialEventId: 'mysterious_old_man' })} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#EEF3FF' },
  title: { fontSize: FONT.body, fontWeight: '800', color: COLORS.secondary },
  grid: { gap: SPACE.s },
});
