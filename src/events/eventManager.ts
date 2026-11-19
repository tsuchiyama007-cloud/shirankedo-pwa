import { GAME_CONFIG } from '../config/gameConfig';
import { EVENTS } from '../data/events';
import { canAfford } from '../currency/currencyManager';
import { discoverEvent } from '../collection/collectionManager';
import { getItemCount } from '../items/inventoryManager';
import { toLocalDateKey, toMonthDay } from '../core/dateUtil';
import { logger } from '../core/logger';
import { defaultRandom, pickWeighted, type RandomSource } from '../core/random';
import { applyOutcome, emptySummary, giveExperience, type RewardSummary } from '../core/rewards';
import type { EventChoice, EventCondition, EventData, EventOutcome, PlayerData, WeightedOutcome } from '../core/types';

/**
 * ランダムイベントの管理。
 * イベント選択 → 条件確認 → 発生 → 結果処理 → 報酬処理 → 図鑑登録 をここで行う。
 */

const EVENT_MAP: ReadonlyMap<string, EventData> = new Map(EVENTS.map((e) => [e.id, e]));
const FALLBACK_EVENT_ID = 'nothing_happened';

export function getEvent(id: string): EventData | null {
  const event = EVENT_MAP.get(id);
  if (!event) logger.warn('EventManager', `存在しないイベントID: ${id}`);
  return event ?? null;
}

export function getAllEvents(): readonly EventData[] {
  return EVENTS;
}

function isInTimeRange(hour: number, range: { startHour: number; endHour: number }): boolean {
  const { startHour, endHour } = range;
  // 例：20〜2時のように日をまたぐ場合
  if (startHour > endHour) return hour >= startHour || hour <= endHour;
  return hour >= startHour && hour <= endHour;
}

/** 条件をすべて満たしているか */
export function meetsConditions(conditions: EventCondition | undefined, player: PlayerData, now: Date): boolean {
  if (!conditions) return true;
  const c = conditions;
  if (c.minimumMoney !== undefined && player.money < c.minimumMoney) return false;
  if (c.minimumLevel !== undefined && player.level < c.minimumLevel) return false;
  if (c.requiredItem !== undefined && getItemCount(player, c.requiredItem) <= 0) return false;
  if (c.requiredEvent !== undefined && !player.discoveredEvents.some((r) => r.id === c.requiredEvent)) return false;
  if (c.minimumPlayCount !== undefined && player.playCount < c.minimumPlayCount) return false;
  if (c.dates !== undefined && !c.dates.includes(toMonthDay(now))) return false;
  if (c.timeRange !== undefined && !isInTimeRange(now.getHours(), c.timeRange)) return false;
  return true;
}

/**
 * 発生するイベントを1つ選ぶ。
 * special が true のときは運試しの「特殊イベント」専用の中から選ぶ。
 */
export function pickRandomEvent(
  player: PlayerData,
  now: Date = new Date(),
  random: RandomSource = defaultRandom,
  options: { special?: boolean } = {},
): EventData {
  const special = options.special ?? false;
  const candidates = EVENTS.filter((e) => (e.specialOnly ?? false) === special && meetsConditions(e.conditions, player, now));
  const picked = pickWeighted(candidates, (e) => e.weight, random);
  if (picked) return picked;
  logger.warn('EventManager', '条件を満たすイベントがないため、代わりのイベントを使います');
  return EVENT_MAP.get(FALLBACK_EVENT_ID) ?? EVENTS[0];
}

/** 選択肢（または結果）で起こりうる、いちばん大きな支払い額 */
function worstMoneyDelta(outcome?: EventOutcome, outcomes?: WeightedOutcome[]): number {
  const deltas = [outcome?.moneyDelta ?? 0, ...(outcomes ?? []).map((o) => o.outcome.moneyDelta ?? 0)];
  return Math.min(0, ...deltas);
}

/** 所持金が足りて、選べる選択肢か */
export function isChoiceAffordable(choice: EventChoice, player: PlayerData): boolean {
  return canAfford(player, -worstMoneyDelta(choice.outcome, choice.outcomes));
}

/** 結果を先に決める（重み付きの場合は抽選） */
function decideOutcome(
  outcome: EventOutcome | undefined,
  outcomes: WeightedOutcome[] | undefined,
  random: RandomSource,
): EventOutcome {
  if (outcomes && outcomes.length > 0) {
    const picked = pickWeighted(outcomes, (o) => o.weight, random);
    if (picked) return picked.outcome;
  }
  return outcome ?? { message: '何も起きなかった。' };
}

/** 1日の発生回数の上限に達していないか */
export function remainingRandomEventsToday(player: PlayerData, now: Date = new Date()): number | null {
  const limit = GAME_CONFIG.randomEventDailyLimit;
  if (limit <= 0) return null; // 無制限
  const today = toLocalDateKey(now);
  const used = player.randomEventCounter?.date === today ? player.randomEventCounter.count : 0;
  return Math.max(0, limit - used);
}

/** ランダムイベントを1回分カウントする（発生させた時点で数える） */
export function countRandomEvent(player: PlayerData, now: Date = new Date()): PlayerData {
  const today = toLocalDateKey(now);
  const used = player.randomEventCounter?.date === today ? player.randomEventCounter.count : 0;
  return { ...player, randomEventCounter: { date: today, count: used + 1 } };
}

export type EventResolution =
  | { ok: true; player: PlayerData; outcome: EventOutcome; summary: RewardSummary; isNewEvent: boolean }
  | { ok: false; reason: 'insufficient' | 'invalidChoice' };

/**
 * イベントを決着させる。
 * 結果を先に決定 → 報酬処理 → 図鑑登録 → プレイ回数加算 を、1つの新しい PlayerData にまとめて返す。
 */
export function resolveEvent(
  player: PlayerData,
  event: EventData,
  choiceIndex: number | null,
  random: RandomSource = defaultRandom,
  now: Date = new Date(),
): EventResolution {
  let outcome: EventOutcome;
  if (event.type === 'choice') {
    const choice = choiceIndex !== null ? event.choices?.[choiceIndex] : undefined;
    if (!choice) return { ok: false, reason: 'invalidChoice' };
    if (!isChoiceAffordable(choice, player)) return { ok: false, reason: 'insufficient' };
    outcome = decideOutcome(choice.outcome, choice.outcomes, random);
  } else {
    outcome = decideOutcome(event.outcome, event.outcomes, random);
  }

  const summary = emptySummary();
  const applied = applyOutcome(player, outcome, `イベント:${event.id}`, summary, now);
  if (!applied.ok) {
    // 自動イベントで支払えない場合は「お金が足りなかった」扱いにして続行する
    if (event.type === 'auto') {
      outcome = { message: `${outcome.message}\n\n……と思ったら、お金が足りなかった。` };
    } else {
      return { ok: false, reason: 'insufficient' };
    }
  }
  let next = applied.ok ? applied.player : player;

  next = giveExperience(next, GAME_CONFIG.experience.randomEvent, summary);
  const discovered = discoverEvent(next, event.id, now);
  next = discovered.player;
  if (discovered.isNew) next = giveExperience(next, GAME_CONFIG.experience.firstDiscoveryBonus, summary);
  next = { ...next, playCount: next.playCount + 1 };

  logger.info('EventManager', `イベント決着: ${event.id}`, outcome.message);
  return { ok: true, player: next, outcome, summary, isNewEvent: discovered.isNew };
}
