import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { useGame } from '../../core/GameManager';
import { AppButton } from '../components/AppButton';
import { usePopup } from '../components/Popup';
import { Screen } from '../components/Screen';
import { useNavigation } from '../navigation';
import { COLORS, FONT, SPACE, STICKER } from '../theme';

export function TitleScreen() {
  const game = useGame();
  const nav = useNavigation();
  const popup = usePopup();
  const canContinue = game.loadResult?.status === 'ok' || game.loadResult?.status === 'recovered';

  const onNew = async () => {
    // 既存のデータがあるときは、上書きしてよいか確認する（勝手に消さない）
    if (game.hasSaveData) {
      const ok = await popup.confirm(
        'セーブデータがあります。\nはじめからにすると、今のデータは上書きされます。\n\nよろしいですか？',
        'はじめから遊ぶ',
      );
      if (!ok) return;
    }
    nav.navigate('PlayerCreate');
  };

  const onContinue = async () => {
    if (game.loadResult?.status === 'recovered') {
      await popup.showPopup({ icon: '🛟', message: 'セーブデータの一部が読めなかったため、\nバックアップから復旧しました。' });
    }
    if (game.continueGame()) nav.reset('Home');
  };

  const loadFailed = game.loadResult?.status === 'error';
  const version = Constants.expoConfig?.version ?? '';

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Text style={styles.small}>なにをするゲームかは</Text>
        <View style={styles.bubble}>
          <Text style={styles.logo}>知らんけど</Text>
        </View>
        <Text style={styles.tagline}>自由に遊んで、たまに何か起きる。</Text>
      </View>

      <View style={styles.menu}>
        <AppButton label="はじめから" onPress={onNew} disabled={!game.ready} testID="title-new" />
        <AppButton label="つづきから" variant="secondary" onPress={onContinue} disabled={!game.ready || !canContinue} testID="title-continue" />
        <AppButton label="設定" variant="plain" onPress={() => nav.navigate('Settings')} disabled={!game.ready} />
      </View>

      {loadFailed ? (
        <View style={styles.warn}>
          <Text style={styles.warnText}>
            セーブデータを読み込めませんでした。{'\n'}データは消さずに残してあります。
          </Text>
          <AppButton label="もう一度読み込む" variant="plain" onPress={() => game.reload()} />
        </View>
      ) : null}

      <Text style={styles.version}>ver {version}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: SPACE.xxl * 1.5, marginBottom: SPACE.xxl, gap: SPACE.m },
  small: { fontSize: FONT.body, color: COLORS.subInk, fontWeight: '700' },
  bubble: {
    ...STICKER,
    borderWidth: 3,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACE.l,
    paddingHorizontal: SPACE.xxl,
    transform: [{ rotate: '-4deg' }],
    shadowColor: COLORS.ink,
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  logo: { fontSize: 46, fontWeight: '900', color: COLORS.ink, letterSpacing: 2 },
  tagline: { fontSize: FONT.body, color: COLORS.ink, marginTop: SPACE.m },
  menu: { gap: SPACE.l },
  warn: { marginTop: SPACE.l, gap: SPACE.s },
  warnText: { color: COLORS.danger, textAlign: 'center', fontSize: FONT.body, lineHeight: 22 },
  version: { textAlign: 'center', color: COLORS.subInk, fontSize: FONT.small, marginTop: 'auto', paddingTop: SPACE.xl },
});
