import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { AD_FAILED_MESSAGE, AdManager } from '../../ads/adManager';
import { GAME_CONFIG } from '../../config/gameConfig';
import { formatYen } from '../../core/format';
import { useGame, usePlayer } from '../../core/GameManager';
import type { RewardSummary } from '../../core/rewards';
import type { EventData, LuckTableEntry, PlayerData } from '../../core/types';
import { LUCK_TABLE } from '../../data/luckTable';
import { canPlayLuckGame, playLuckGame, type LuckPayment } from '../../minigames/luckGame';
import { vibrate } from '../../settings/feedback';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { usePopup } from '../components/Popup';
import { RewardList } from '../components/RewardList';
import { Screen } from '../components/Screen';
import { PlayerStatus } from '../components/StatusBar';
import { useNavigation } from '../navigation';
import { COLORS, FONT, SPACE, STICKER } from '../theme';

type Phase =
  | { kind: 'ready' }
  /** before：演出中は、結果が分からないよう抽選前の所持金を表示する */
  | { kind: 'rolling'; entry: LuckTableEntry; summary: RewardSummary; specialEvent: EventData | null; before: PlayerData }
  | { kind: 'result'; entry: LuckTableEntry; summary: RewardSummary; specialEvent: EventData | null };

/** 結果ごとの見出し */
function resultHeadline(entry: LuckTableEntry): { icon: string; text: string } {
  switch (entry.prize.kind) {
    case 'money':
      return { icon: entry.prize.amount >= 10000 ? '🤑' : '💰', text: `${formatYen(entry.prize.amount)} 当たり！` };
    case 'item':
      return { icon: '🎁', text: 'アイテムが出た！' };
    case 'specialEvent':
      return { icon: '🌀', text: '特殊イベント発生！' };
    default:
      return { icon: '🍃', text: '何も起きなかった。' };
  }
}

export function LuckGameScreen() {
  const game = useGame();
  const player = usePlayer();
  const nav = useNavigation();
  const popup = usePopup();
  const [phase, setPhase] = useState<Phase>({ kind: 'ready' });
  const [slotText, setSlotText] = useState('？');
  const spin = useRef(new Animated.Value(0)).current;

  // 演出：表示を回すだけ。結果はすでに決まっていて、ここでは変わらない
  useEffect(() => {
    if (phase.kind !== 'rolling') return;
    nav.setBackBlocked(true);
    let i = 0;
    const labels = LUCK_TABLE.map((e) => e.label);
    const timer = setInterval(() => setSlotText(labels[i++ % labels.length]), 90);
    spin.setValue(0);
    Animated.timing(spin, { toValue: 1, duration: GAME_CONFIG.luckGameAnimationMs, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const done = setTimeout(() => {
      clearInterval(timer);
      setSlotText(phase.entry.label);
      setPhase({ kind: 'result', entry: phase.entry, summary: phase.summary, specialEvent: phase.specialEvent });
      nav.setBackBlocked(false);
      const big = phase.entry.prize.kind === 'money' && phase.entry.prize.amount >= 10000;
      vibrate(player.settings, big ? 'bigWin' : 'win');
    }, GAME_CONFIG.luckGameAnimationMs);
    return () => {
      clearInterval(timer);
      clearTimeout(done);
      nav.setBackBlocked(false);
    };
    // phase が変わったときだけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const play = (payment: LuckPayment) =>
    game.runExclusive(async () => {
      const current = game.player;
      if (!current) return;
      if (!canPlayLuckGame(current, payment)) {
        await popup.showPopup({ icon: '👛', message: 'お金が足りません。' });
        return;
      }
      const ok = await popup.confirm(
        payment === 'money' ? `${formatYen(GAME_CONFIG.luckGameCost)}を使って運試ししますか？` : '無料チケットを1枚使って運試ししますか？',
        '運試しする',
      );
      if (!ok) return;

      // 支払い・抽選・報酬をまとめて決めて保存してから、演出を流す
      const before = game.player ?? current;
      const result = playLuckGame(before, payment);
      if (!result.ok) {
        await popup.showPopup({ icon: '👛', message: 'お金が足りません。' });
        return;
      }
      await game.commit(result.player);
      setPhase({ kind: 'rolling', entry: result.entry, summary: result.summary, specialEvent: result.specialEvent, before });
    });

  const watchAd = () =>
    game.runExclusive(async () => {
      const result = await AdManager.showRewardedAd();
      if (!result.rewarded) {
        if (result.reason !== 'closed') await popup.showPopup({ icon: '📺', message: AD_FAILED_MESSAGE });
        return;
      }
      const current = game.player;
      if (!current) return;
      await game.commit({ ...current, freeLuckTickets: current.freeLuckTickets + 1 });
      await popup.showPopup({ icon: '🎟️', message: '無料チケットを1枚もらいました。' });
    });

  // 結果表示が終わって「OK」したら、レベルアップ通知を出す
  const finish = async () => {
    if (phase.kind !== 'result') return;
    await game.announceLevelUp(phase.summary);
    if (phase.specialEvent) {
      nav.replace('RandomEvent', { specialEventId: phase.specialEvent.id });
      return;
    }
    setSlotText('？');
    setPhase({ kind: 'ready' });
  };

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] });
  const busy = game.busy || phase.kind === 'rolling';

  return (
    <Screen title="運試し" showBack={phase.kind !== 'rolling'}>
      <PlayerStatus player={phase.kind === 'rolling' ? phase.before : player} compact />

      <View style={styles.stage}>
        <Animated.View style={[styles.dice, { transform: [{ rotate: phase.kind === 'rolling' ? rotate : '0deg' }] }]}>
          <Text style={styles.diceIcon}>{phase.kind === 'result' ? resultHeadline(phase.entry).icon : '🎲'}</Text>
        </Animated.View>
        <View style={styles.slot}>
          <Text style={styles.slotText} numberOfLines={1} adjustsFontSizeToFit testID="luck-slot">
            {slotText}
          </Text>
        </View>
      </View>

      {phase.kind === 'result' ? (
        <Card>
          <Text style={styles.headline} testID="luck-result">
            {resultHeadline(phase.entry).text}
          </Text>
          <RewardList summary={phase.summary} />
          {phase.entry.prize.kind === 'nothing' ? <Text style={styles.shiranke}>知らんけど。</Text> : null}
          <AppButton label={phase.specialEvent ? 'イベントへ' : 'OK'} onPress={finish} testID="luck-ok" style={{ marginTop: SPACE.s }} />
        </Card>
      ) : (
        <View style={styles.actions}>
          <AppButton
            label="運試しする"
            note={`${formatYen(GAME_CONFIG.luckGameCost)}で1回`}
            onPress={() => play('money')}
            disabled={busy}
            testID="luck-play"
          />
          {player.freeLuckTickets > 0 ? (
            <AppButton
              label="無料で運試し"
              note={`チケット 残り${player.freeLuckTickets}枚`}
              variant="secondary"
              onPress={() => play('freeTicket')}
              disabled={busy}
            />
          ) : null}
          {AdManager.isAvailable() ? (
            <AppButton label="広告を見て無料チケットをもらう" icon="📺" variant="plain" onPress={watchAd} disabled={busy} note="見るかどうかは自由です" />
          ) : null}
          <AppButton label="確率を見る" variant="plain" onPress={() => nav.navigate('LuckOdds')} disabled={busy} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: { alignItems: 'center', gap: SPACE.l, marginVertical: SPACE.l },
  dice: {
    ...STICKER,
    borderWidth: 3,
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceIcon: { fontSize: 60 },
  slot: { ...STICKER, backgroundColor: COLORS.ink, paddingVertical: SPACE.m, paddingHorizontal: SPACE.xl, minWidth: 240, alignItems: 'center' },
  slotText: { color: COLORS.accent, fontSize: FONT.title, fontWeight: '900' },
  headline: { fontSize: FONT.title, fontWeight: '900', color: COLORS.ink, textAlign: 'center' },
  shiranke: { textAlign: 'center', color: COLORS.subInk },
  actions: { gap: SPACE.m },
});
