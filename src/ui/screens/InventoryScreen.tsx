import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatYen } from '../../core/format';
import { useGame, usePlayer } from '../../core/GameManager';
import type { ItemData } from '../../core/types';
import { RARITY_LABEL } from '../../data/items';
import { listOwnedItems } from '../../items/inventoryManager';
import { sellItem, consumeItem } from '../../items/itemActions';
import { Card } from '../components/Card';
import { usePopup } from '../components/Popup';
import { Screen } from '../components/Screen';
import { PlayerStatus } from '../components/StatusBar';
import { COLORS, FONT, MIN_TOUCH, SPACE } from '../theme';

/** 持ち物（インベントリ）。タップで詳細・使う・売る */
export function InventoryScreen() {
  const game = useGame();
  const player = usePlayer();
  const popup = usePopup();
  const owned = listOwnedItems(player);

  const openItem = (item: ItemData, count: number) =>
    game.runExclusive(async () => {
      type Action = 'use' | 'sell' | 'close';
      const buttons: { label: string; value: Action; variant?: 'primary' | 'secondary' | 'plain' }[] = [];
      if (item.usable) buttons.push({ label: '使う', value: 'use', variant: 'primary' });
      if (item.sellable) buttons.push({ label: `売る（${formatYen(item.sellPrice)}）`, value: 'sell', variant: 'secondary' });
      buttons.push({ label: '閉じる', value: 'close', variant: 'plain' });

      const action = await popup.showPopup<Action>({
        icon: item.icon,
        title: `${item.name}  ×${count}`,
        message: `${RARITY_LABEL[item.rarity]}\n\n${item.description}${item.sellable ? '' : '\n\n（売れません）'}`,
        buttons,
      });
      const current = game.player;
      if (!current || action === 'close') return;

      if (action === 'sell') {
        const ok = await popup.confirm(`${item.name}を1個、${formatYen(item.sellPrice)}で売りますか？`, '売る');
        if (!ok) return;
      }
      const result = action === 'use' ? consumeItem(current, item.id) : sellItem(current, item.id, 1);
      if (!result.ok) {
        await popup.showPopup({ message: result.message });
        return;
      }
      await game.commit(result.player);
      await popup.showPopup({ icon: item.icon, message: action === 'sell' ? `${result.message}\n+${formatYen(item.sellPrice)}` : result.message });
      await game.announceLevelUp(result.summary);
    });

  return (
    <Screen title="持ち物">
      <PlayerStatus player={player} compact />
      {owned.length === 0 ? (
        <Card>
          <Text style={styles.empty}>まだ何も持っていません。{'\n'}知らんけど。</Text>
        </Card>
      ) : (
        owned.map(({ item, count }) => (
          <Pressable
            key={item.id}
            onPress={() => openItem(item, count)}
            disabled={game.busy}
            accessibilityRole="button"
            accessibilityLabel={`${item.name} ${count}個`}
            testID={`item-${item.id}`}
          >
            <Card style={styles.row}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.texts}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.count}>×{count}</Text>
                </View>
                <Text style={styles.rarity}>{RARITY_LABEL[item.rarity]}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', fontSize: FONT.body, color: COLORS.subInk, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, minHeight: MIN_TOUCH + 20 },
  icon: { fontSize: 40, width: 52, textAlign: 'center' },
  texts: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink, flexShrink: 1 },
  count: { fontSize: FONT.large, fontWeight: '800', color: COLORS.primaryDark },
  rarity: { fontSize: FONT.small, color: COLORS.accent, fontWeight: '900', textShadowColor: COLORS.ink, textShadowRadius: 1 },
  desc: { fontSize: FONT.small, color: COLORS.subInk },
});
