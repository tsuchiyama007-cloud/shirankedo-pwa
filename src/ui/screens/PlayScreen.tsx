import { StyleSheet, Text } from 'react-native';
import { MINIGAMES } from '../../minigames/minigameRegistry';
import { usePlayer } from '../../core/GameManager';
import { AppButton } from '../components/AppButton';
import { Screen } from '../components/Screen';
import { PlayerStatus } from '../components/StatusBar';
import { useNavigation } from '../navigation';
import { COLORS, FONT } from '../theme';

/** 「遊ぶ」：ミニゲームの一覧（minigameRegistry.ts に登録したものが並ぶ） */
export function PlayScreen() {
  const player = usePlayer();
  const nav = useNavigation();
  return (
    <Screen title="遊ぶ">
      <PlayerStatus player={player} compact />
      <Text style={styles.lead}>何して遊ぶ？</Text>
      {MINIGAMES.map((g) => (
        <AppButton key={g.id} icon={g.icon} label={g.title} note={g.description} onPress={() => nav.navigate(g.screen)} testID={`play-${g.id}`} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: FONT.body, color: COLORS.subInk, textAlign: 'center' },
});
