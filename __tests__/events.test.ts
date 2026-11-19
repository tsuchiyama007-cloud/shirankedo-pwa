import { EVENTS } from '../src/data/events';
import { ITEMS } from '../src/data/items';
import {
  countRandomEvent,
  getEvent,
  isChoiceAffordable,
  meetsConditions,
  pickRandomEvent,
  remainingRandomEventsToday,
  resolveEvent,
} from '../src/events/eventManager';
import { createNewPlayer } from '../src/player/playerData';
import { addItem } from '../src/items/inventoryManager';
import { GAME_CONFIG } from '../src/config/gameConfig';
import { sequenceRandom } from './helpers';

const noon = new Date(2026, 10, 19, 12, 0);

describe('イベント', () => {
  test('イベント定義：IDの重複なし・参照するアイテム/イベントが存在する・形が正しい', () => {
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    const itemIds = new Set(ITEMS.map((i) => i.id));
    const eventIds = new Set(EVENTS.map((e) => e.id));
    for (const e of EVENTS) {
      const outcomes = [
        e.outcome,
        ...(e.outcomes ?? []).map((o) => o.outcome),
        ...(e.choices ?? []).flatMap((c) => [c.outcome, ...(c.outcomes ?? []).map((o) => o.outcome)]),
      ].filter(Boolean);
      for (const o of outcomes) if (o!.itemId) expect(itemIds.has(o!.itemId)).toBe(true);
      if (e.conditions?.requiredItem) expect(itemIds.has(e.conditions.requiredItem)).toBe(true);
      if (e.conditions?.requiredEvent) expect(eventIds.has(e.conditions.requiredEvent)).toBe(true);
      if (e.type === 'choice') expect(e.choices?.length).toBeGreaterThan(0);
      else expect(e.outcome || e.outcomes?.length).toBeTruthy();
    }
  });

  test('100円を拾った：はい → +100円', () => {
    const p = createNewPlayer('A');
    const r = resolveEvent(p, getEvent('found_100yen')!, 0, Math.random, noon);
    expect(r.ok && r.player.money).toBe(1100);
  });

  test('100円を拾った：いいえ → 何もなし', () => {
    const r = resolveEvent(createNewPlayer('A'), getEvent('found_100yen')!, 1, Math.random, noon);
    expect(r.ok && r.player.money).toBe(1000);
  });

  test('自動販売機：-100円', () => {
    const r = resolveEvent(createNewPlayer('A'), getEvent('vending_machine')!, null, Math.random, noon);
    expect(r.ok && r.player.money).toBe(900);
  });

  test('TC-006 新規イベントは図鑑に登録され、2回目は重複登録しない', () => {
    const e = getEvent('cat_eye_contact')!;
    const r1 = resolveEvent(createNewPlayer('A'), e, null, Math.random, noon);
    expect(r1.ok && r1.isNewEvent).toBe(true);
    if (!r1.ok) return;
    expect(r1.player.discoveredEvents.map((d) => d.id)).toEqual(['cat_eye_contact']);
    const r2 = resolveEvent(r1.player, e, null, Math.random, noon);
    expect(r2.ok && r2.isNewEvent).toBe(false);
    expect(r2.ok && r2.player.discoveredEvents.length).toBe(1);
  });

  test('お金が足りない選択肢は選べない', () => {
    const poor = { ...createNewPlayer('A'), money: 400 };
    const e = getEvent('fortune_teller')!;
    expect(isChoiceAffordable(e.choices![0], poor)).toBe(false);
    expect(resolveEvent(poor, e, 0, Math.random, noon)).toEqual({ ok: false, reason: 'insufficient' });
    expect(isChoiceAffordable(e.choices![1], poor)).toBe(true);
  });

  test('条件：所持金・レベル・アイテム・イベント・時間帯・日付', () => {
    const p = createNewPlayer('A');
    expect(meetsConditions({ minimumMoney: 2000 }, p, noon)).toBe(false);
    expect(meetsConditions({ minimumLevel: 3 }, p, noon)).toBe(false);
    expect(meetsConditions({ requiredItem: 'four_leaf_clover' }, p, noon)).toBe(false);
    expect(meetsConditions({ requiredItem: 'four_leaf_clover' }, addItem(p, 'four_leaf_clover'), noon)).toBe(true);
    expect(meetsConditions({ requiredEvent: 'nothing_happened' }, p, noon)).toBe(false);
    expect(meetsConditions({ timeRange: { startHour: 20, endHour: 2 } }, p, new Date(2026, 0, 1, 23))).toBe(true);
    expect(meetsConditions({ timeRange: { startHour: 20, endHour: 2 } }, p, new Date(2026, 0, 1, 1))).toBe(true);
    expect(meetsConditions({ timeRange: { startHour: 20, endHour: 2 } }, p, noon)).toBe(false);
    expect(meetsConditions({ dates: ['01-01'] }, p, new Date(2026, 0, 1, 10))).toBe(true);
    expect(meetsConditions({ dates: ['01-01'] }, p, noon)).toBe(false);
  });

  test('通常のランダムイベントでは特殊イベントや条件外のイベントは出ない', () => {
    const p = { ...createNewPlayer('A'), money: 0 };
    for (let i = 0; i < 300; i++) {
      const e = pickRandomEvent(p, noon);
      expect(e.specialOnly).toBeFalsy();
      expect(e.id).not.toBe('vending_machine');
      expect(e.id).not.toBe('night_ramen');
    }
    expect(pickRandomEvent(p, noon, Math.random, { special: true }).specialOnly).toBe(true);
  });

  test('結果は先に決まる：同じ乱数なら同じ結果', () => {
    const e = getEvent('lottery_stand')!;
    const a = resolveEvent(createNewPlayer('A'), e, 0, sequenceRandom(0.995), noon);
    const b = resolveEvent(createNewPlayer('A'), e, 0, sequenceRandom(0.995), noon);
    expect(a.ok && a.outcome).toEqual(b.ok && b.outcome);
    expect(a.ok && a.player.money).toBe(1000 + 29700);
  });

  test('1日の回数制限：日付が変わるとリセット', () => {
    let p = createNewPlayer('A');
    for (let i = 0; i < GAME_CONFIG.randomEventDailyLimit; i++) p = countRandomEvent(p, noon);
    expect(remainingRandomEventsToday(p, noon)).toBe(0);
    expect(remainingRandomEventsToday(p, new Date(2026, 10, 20, 0, 1))).toBe(GAME_CONFIG.randomEventDailyLimit);
  });

  test('イベントでプレイ回数・経験値が増える', () => {
    const r = resolveEvent(createNewPlayer('A'), getEvent('pigeons')!, null, Math.random, noon);
    expect(r.ok && r.player.playCount).toBe(1);
    expect(r.ok && r.summary.experience).toBe(GAME_CONFIG.experience.randomEvent + GAME_CONFIG.experience.firstDiscoveryBonus);
  });
});
