import { StyleSheet, Text, View } from 'react-native';
import { formatYen } from '../../core/format';
import type { PlayerData } from '../../core/types';
import { requiredExperience } from '../../player/playerLevelSystem';
import { MAX_LEVEL } from '../../config/gameConfig';
import { COLORS, FONT, SPACE, STICKER } from '../theme';

/** プレイヤー名・所持金・レベル・経験値 */
export function PlayerStatus({ player, compact }: { player: PlayerData; compact?: boolean }) {
  const need = requiredExperience(player.level);
  const ratio = player.level >= MAX_LEVEL ? 1 : Math.min(1, player.experience / need);
  return (
    <View style={[styles.box, compact && styles.compact]}>
      {!compact ? <Text style={styles.name}>{player.playerName}</Text> : null}
      <Text style={styles.money} testID="money">
        {formatYen(player.money)}
      </Text>
      <View style={styles.levelRow}>
        <Text style={styles.level}>Lv.{player.level}</Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
        </View>
        <Text style={styles.xp}>{player.level >= MAX_LEVEL ? 'MAX' : `${player.experience}/${need}`}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { ...STICKER, backgroundColor: COLORS.card, padding: SPACE.l, gap: SPACE.xs },
  compact: { paddingVertical: SPACE.s },
  name: { fontSize: FONT.body, fontWeight: '700', color: COLORS.subInk },
  money: { fontSize: FONT.huge, fontWeight: '900', color: COLORS.ink, letterSpacing: 0.5 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  level: { fontSize: FONT.body, fontWeight: '800', color: COLORS.secondary, minWidth: 48 },
  bar: { flex: 1, height: 12, borderRadius: 6, backgroundColor: '#EFE7DA', overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.ink },
  fill: { height: '100%', backgroundColor: COLORS.accent },
  xp: { fontSize: FONT.small, color: COLORS.subInk, minWidth: 70, textAlign: 'right' },
});
