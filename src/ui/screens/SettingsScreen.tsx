import Constants from 'expo-constants';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useGame } from '../../core/GameManager';
import type { Settings } from '../../core/types';
import { DEFAULT_SETTINGS } from '../../player/playerData';
import { SETTING_LABELS, updateSetting } from '../../settings/settingsManager';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { usePopup } from '../components/Popup';
import { Screen } from '../components/Screen';
import { useNavigation } from '../navigation';
import { COLORS, FONT, MIN_TOUCH, SPACE } from '../theme';
import { DebugPanel } from './DebugPanel';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/**
 * 設定。ON/OFF はプレイヤーデータに保存する。
 * タイトル画面から開いた場合（まだプレイヤーがいない）は、表示のみで変更できない。
 */
export function SettingsScreen() {
  const game = useGame();
  const nav = useNavigation();
  const popup = usePopup();
  const player = game.player;
  const settings = player?.settings ?? DEFAULT_SETTINGS;

  const toggle = (key: keyof Settings, value: boolean) =>
    game.runExclusive(async () => {
      if (!game.player) return;
      await game.commit(updateSetting(game.player, key, value));
    });

  const toTitle = async () => {
    const ok = await popup.confirm('タイトル画面に戻りますか？\n（データは自動で保存されています）', '戻る');
    if (!ok) return;
    await game.reload();
    nav.reset('Title');
  };

  return (
    <Screen title="設定">
      <Card>
        {(Object.keys(SETTING_LABELS) as (keyof Settings)[]).map((key) => (
          <View key={key} style={styles.row}>
            <View style={styles.texts}>
              <Text style={styles.label}>{SETTING_LABELS[key].label}</Text>
              {SETTING_LABELS[key].note ? <Text style={styles.note}>{SETTING_LABELS[key].note}</Text> : null}
            </View>
            <Switch
              value={settings[key]}
              onValueChange={(v) => toggle(key, v)}
              disabled={!player || game.busy}
              trackColor={{ true: COLORS.primary, false: COLORS.disabled }}
              thumbColor="#fff"
              {...({ activeThumbColor: '#fff' } as object)}
              accessibilityLabel={SETTING_LABELS[key].label}
              testID={`setting-${key}`}
            />
          </View>
        ))}
        {!player ? <Text style={styles.note}>ゲームを始めると変更できます。</Text> : null}
      </Card>

      {player ? <AppButton label="タイトルへ戻る" variant="plain" onPress={toTitle} /> : null}

      {isDev && player ? <DebugPanel /> : null}

      <Text style={styles.footer}>
        知らんけど ver {Constants.expoConfig?.version ?? ''}
        {'\n'}ゲーム内のお金は現実のお金ではありません。
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH, gap: SPACE.m, borderBottomWidth: 1, borderBottomColor: '#F0E8DC', paddingVertical: SPACE.s },
  texts: { flex: 1 },
  label: { fontSize: FONT.large, fontWeight: '700', color: COLORS.ink },
  note: { fontSize: FONT.small, color: COLORS.subInk, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: FONT.small, color: COLORS.subInk, marginTop: SPACE.l, lineHeight: 20 },
});
