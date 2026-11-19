import { useEffect } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { ensureDailyMessage, getDailyMessageText } from '../../core/dailyMessage';
import { DAILY_MESSAGE_SUFFIX } from '../../data/dailyMessages';
import { useGame, usePlayer } from '../../core/GameManager';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { usePopup } from '../components/Popup';
import { Screen } from '../components/Screen';
import { PlayerStatus } from '../components/StatusBar';
import { useNavigation, type ScreenName } from '../navigation';
import { COLORS, FONT, SPACE } from '../theme';

const COMING_SOON = 'この機能は現在準備中です。';

type MenuItem = { label: string; icon: string; screen: ScreenName | null };

/** ホームのボタン。screen が null のものは v1.0 では準備中 */
const MENU: MenuItem[] = [
  { label: '人生', icon: '🏠', screen: null },
  { label: '遊ぶ', icon: '🎲', screen: 'Play' },
  { label: '探索', icon: '🧭', screen: null },
  { label: '図鑑', icon: '📖', screen: 'Collection' },
  { label: '持ち物', icon: '🎒', screen: 'Inventory' },
  { label: 'ショップ', icon: '🏪', screen: null },
];

export function HomeScreen() {
  const game = useGame();
  const player = usePlayer();
  const nav = useNavigation();
  const popup = usePopup();

  // 「今日の知らんけど」：日付が変わっていたら新しいメッセージにする（アプリ復帰時も確認）
  useEffect(() => {
    const check = () => {
      const p = game.player;
      if (!p) return;
      const result = ensureDailyMessage(p);
      if (result.changed) game.commit(result.player);
    };
    check();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => sub.remove();
  }, [game]);

  const open = (item: MenuItem) => {
    if (item.screen) nav.navigate(item.screen);
    else popup.showPopup({ icon: '🚧', message: COMING_SOON });
  };

  return (
    <Screen showBack={false}>
      <PlayerStatus player={player} />

      <Card style={styles.daily}>
        <Text style={styles.dailyLabel}>今日の知らんけど</Text>
        <Text style={styles.dailyText} testID="daily-message">
          {getDailyMessageText(player)}
        </Text>
        <Text style={styles.dailySuffix}>{DAILY_MESSAGE_SUFFIX}</Text>
      </Card>

      <View style={styles.grid}>
        {MENU.map((item) => (
          <View key={item.label} style={styles.cell}>
            <AppButton
              label={item.label}
              icon={item.icon}
              variant={item.screen ? 'primary' : 'plain'}
              note={item.screen ? undefined : '準備中'}
              onPress={() => open(item)}
              testID={`home-${item.label}`}
            />
          </View>
        ))}
      </View>
      <AppButton label="設定" icon="⚙️" variant="plain" onPress={() => nav.navigate('Settings')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  daily: { backgroundColor: '#FFFBEF', transform: [{ rotate: '-0.6deg' }] },
  dailyLabel: { fontSize: FONT.small, fontWeight: '800', color: COLORS.primaryDark, letterSpacing: 1 },
  dailyText: { fontSize: FONT.large, fontWeight: '700', color: COLORS.ink, lineHeight: 28 },
  dailySuffix: { fontSize: FONT.body, color: COLORS.subInk, alignSelf: 'flex-end' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACE.s / 2, rowGap: SPACE.m },
  cell: { width: '50%', paddingHorizontal: SPACE.s / 2 },
});
