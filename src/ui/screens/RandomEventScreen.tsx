import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGame, usePlayer } from '../../core/GameManager';
import type { RewardSummary } from '../../core/rewards';
import type { EventData, EventOutcome } from '../../core/types';
import {
  countRandomEvent,
  getEvent,
  isChoiceAffordable,
  pickRandomEvent,
  remainingRandomEventsToday,
  resolveEvent,
} from '../../events/eventManager';
import { vibrate } from '../../settings/feedback';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { NewBadge } from '../components/NewBadge';
import { usePopup } from '../components/Popup';
import { RewardList } from '../components/RewardList';
import { Screen } from '../components/Screen';
import { useNavigation } from '../navigation';
import { COLORS, FONT, SPACE } from '../theme';

type Phase =
  | { kind: 'starting' }
  | { kind: 'limit' }
  | { kind: 'event'; event: EventData; special: boolean }
  | { kind: 'result'; event: EventData; special: boolean; outcome: EventOutcome; summary: RewardSummary; isNew: boolean };

/**
 * ランダムイベント。
 * - 通常：「ぶらぶらする」から。1日の回数制限あり（発生した時点で1回と数える）
 * - 特殊：運試しの「特殊イベント」から（回数制限なし）
 * 選択中は「戻る」を無効にし、選び直しによる結果の引き直しを防ぐ。
 */
export function RandomEventScreen() {
  const game = useGame();
  const player = usePlayer();
  const nav = useNavigation();
  const popup = usePopup();
  const specialId = nav.current.params?.specialEventId;
  const [phase, setPhase] = useState<Phase>({ kind: 'starting' });
  const started = useRef(false);

  const start = () =>
    game.runExclusive(async () => {
      const current = game.player;
      if (!current) return;
      if (specialId) {
        const event = getEvent(specialId);
        if (event) {
          setPhase({ kind: 'event', event, special: true });
          return;
        }
      }
      if (remainingRandomEventsToday(current) === 0) {
        setPhase({ kind: 'limit' });
        return;
      }
      const event = pickRandomEvent(current);
      await game.commit(countRandomEvent(current));
      setPhase({ kind: 'event', event, special: false });
    });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
    // 最初の1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    nav.setBackBlocked(phase.kind === 'event');
    return () => nav.setBackBlocked(false);
  }, [phase.kind, nav]);

  const choose = (choiceIndex: number | null) =>
    game.runExclusive(async () => {
      if (phase.kind !== 'event' || !game.player) return;
      const result = resolveEvent(game.player, phase.event, choiceIndex);
      if (!result.ok) {
        await popup.showPopup({ icon: '👛', message: 'お金が足りません。' });
        return;
      }
      await game.commit(result.player);
      if (result.summary.moneyDelta > 0 || result.summary.items.length > 0) vibrate(result.player.settings, 'win');
      setPhase({ kind: 'result', event: phase.event, special: phase.special, outcome: result.outcome, summary: result.summary, isNew: result.isNewEvent });
      // 結果が画面に出てから、レベルアップを知らせる
      setTimeout(() => game.announceLevelUp(result.summary), 400);
    });

  const again = () => {
    started.current = true;
    setPhase({ kind: 'starting' });
    start();
  };

  const remaining = remainingRandomEventsToday(player);

  return (
    <Screen title={phase.kind === 'event' && phase.special ? '特殊イベント' : 'ぶらぶらする'} showBack={phase.kind !== 'event'}>
      {phase.kind === 'starting' ? <Text style={styles.wait}>てくてく……</Text> : null}

      {phase.kind === 'limit' ? (
        <Card>
          <Text style={styles.icon}>🌙</Text>
          <Text style={styles.body}>今日はもう十分歩きました。{'\n'}また明日。{'\n\n'}知らんけど。</Text>
          <AppButton label="もどる" variant="plain" onPress={nav.back} />
        </Card>
      ) : null}

      {phase.kind === 'event' || phase.kind === 'result' ? (
        <Card>
          <View style={styles.titleRow}>
            <Text style={styles.icon}>{phase.event.icon}</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.title} testID="event-title">
              {phase.event.title}
            </Text>
            {phase.kind === 'result' && phase.isNew ? <NewBadge /> : null}
          </View>
          <Text style={styles.body}>{phase.event.description}</Text>
        </Card>
      ) : null}

      {phase.kind === 'event' ? (
        <View style={styles.choices}>
          {phase.event.type === 'choice' ? (
            (phase.event.choices ?? []).map((choice, i) => {
              const affordable = isChoiceAffordable(choice, player);
              return (
                <AppButton
                  key={choice.label}
                  label={choice.label}
                  variant={i === 0 ? 'primary' : 'plain'}
                  disabled={!affordable || game.busy}
                  note={affordable ? undefined : 'お金が足りません'}
                  onPress={() => choose(i)}
                  testID={`event-choice-${i}`}
                />
              );
            })
          ) : (
            <AppButton label="つづける" onPress={() => choose(null)} disabled={game.busy} testID="event-continue" />
          )}
        </View>
      ) : null}

      {phase.kind === 'result' ? (
        <>
          <Card style={styles.result}>
            <Text style={styles.body} testID="event-result">
              {phase.outcome.message}
            </Text>
            <RewardList summary={phase.summary} />
          </Card>
          <View style={styles.choices}>
            {!phase.special && remaining !== 0 ? (
              <AppButton label="もう少しぶらぶらする" note={remaining === null ? undefined : `今日はあと${remaining}回`} onPress={again} disabled={game.busy} testID="event-again" />
            ) : null}
            <AppButton label="もどる" variant="plain" onPress={nav.back} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  wait: { textAlign: 'center', fontSize: FONT.large, color: COLORS.subInk, marginTop: SPACE.xxl },
  titleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACE.s },
  icon: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: FONT.title, fontWeight: '900', color: COLORS.ink, textAlign: 'center' },
  body: { fontSize: FONT.body, lineHeight: 26, color: COLORS.ink, textAlign: 'center' },
  result: { backgroundColor: '#FFFBEF' },
  choices: { gap: SPACE.m },
});
