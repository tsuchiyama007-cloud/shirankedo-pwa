import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { GAME_CONFIG } from '../../config/gameConfig';
import { useGame } from '../../core/GameManager';
import { countCharacters, validatePlayerName } from '../../player/playerData';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { useNavigation } from '../navigation';
import { COLORS, FONT, MIN_TOUCH, SPACE, STICKER } from '../theme';

export function PlayerCreateScreen() {
  const game = useGame();
  const nav = useNavigation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const max = GAME_CONFIG.playerNameMaxLength;

  const onSubmit = () =>
    game.runExclusive(async () => {
      const check = validatePlayerName(name);
      if (!check.ok) {
        setError(check.message);
        return;
      }
      await game.startNewGame(check.name);
      nav.reset('Home');
    });

  return (
    <Screen title="プレイヤー作成">
      <View style={styles.box}>
        <Text style={styles.label}>あなたの名前は？</Text>
        <TextInput
          testID="name-input"
          value={name}
          onChangeText={(t) => {
            setName(t);
            setError(null);
          }}
          placeholder="名前を入力"
          placeholderTextColor={COLORS.locked}
          style={styles.input}
          maxLength={max * 2 /* 絵文字は2文字分として数えられるため余裕を持たせ、判定は validatePlayerName で行う */}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          accessibilityLabel="プレイヤー名"
        />
        <Text style={[styles.count, countCharacters(name.trim()) > max && { color: COLORS.danger }]}>
          {countCharacters(name.trim())} / {max}文字
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.hint}>あとから変えることはできません。たぶん。</Text>
      </View>
      <AppButton label="決定" onPress={onSubmit} disabled={game.busy} testID="name-submit" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.s, marginTop: SPACE.xl },
  label: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink },
  input: {
    ...STICKER,
    backgroundColor: COLORS.card,
    minHeight: MIN_TOUCH + 4,
    paddingHorizontal: SPACE.l,
    fontSize: FONT.large,
    color: COLORS.ink,
  },
  count: { alignSelf: 'flex-end', color: COLORS.subInk, fontSize: FONT.small },
  error: { color: COLORS.danger, fontWeight: '700', fontSize: FONT.body },
  hint: { color: COLORS.subInk, fontSize: FONT.small, marginTop: SPACE.s },
});
