import { GAME_CONFIG } from '../config/gameConfig';
import { LUCK_TABLE } from '../data/luckTable';
import { addMoney, spendMoney } from '../currency/currencyManager';
import { pickRandomEvent } from '../events/eventManager';
import { drawRandomItem } from '../items/itemManager';
import { logger } from '../core/logger';
import { defaultRandom, pickWeighted, type RandomSource } from '../core/random';
import { emptySummary, giveExperience, giveItem, type RewardSummary } from '../core/rewards';
import type { EventData, LuckTableEntry, PlayerData } from '../core/types';

/**
 * 運試し。
 * 抽選は「結果を先に決定 → 演出 → 結果表示」。演出は結果を変えない。
 * この関数は、支払い・抽選・報酬・図鑑登録までを1つの新しい PlayerData にまとめて返す。
 * 画面側は、これを保存してから演出を流し、最後に結果を見せる（途中でアプリが閉じても二重取りや損が起きない）。
 */

export type LuckPayment = 'money' | 'freeTicket';

export type LuckGameResult =
  | {
      ok: true;
      player: PlayerData;
      entry: LuckTableEntry;
      summary: RewardSummary;
      /** 「特殊イベント」が当たったときに発生するイベント */
      specialEvent: EventData | null;
    }
  | { ok: false; reason: 'insufficient' };

export function canPlayLuckGame(player: PlayerData, payment: LuckPayment): boolean {
  if (payment === 'freeTicket') return player.freeLuckTickets > 0;
  return player.money >= GAME_CONFIG.luckGameCost;
}

/** 抽選表から1つ選ぶ（確率表示にも使う） */
export function drawLuckEntry(random: RandomSource = defaultRandom): LuckTableEntry {
  return pickWeighted(LUCK_TABLE, (e) => e.weight, random) ?? LUCK_TABLE[0];
}

/** 抽選表の各結果の確率（%） */
export function luckProbabilities(): { entry: LuckTableEntry; percent: number }[] {
  const total = LUCK_TABLE.reduce((sum, e) => sum + Math.max(0, e.weight), 0);
  return LUCK_TABLE.map((entry) => ({ entry, percent: total > 0 ? (entry.weight / total) * 100 : 0 }));
}

export function playLuckGame(
  player: PlayerData,
  payment: LuckPayment = 'money',
  random: RandomSource = defaultRandom,
  now: Date = new Date(),
): LuckGameResult {
  // 1. 支払い
  let next: PlayerData;
  if (payment === 'freeTicket') {
    if (player.freeLuckTickets <= 0) return { ok: false, reason: 'insufficient' };
    next = { ...player, freeLuckTickets: player.freeLuckTickets - 1 };
  } else {
    const paid = spendMoney(player, GAME_CONFIG.luckGameCost, '運試し');
    if (!paid.ok) return { ok: false, reason: 'insufficient' };
    next = paid.player;
  }

  // 2. 抽選（ここで結果が確定する）
  const entry = drawLuckEntry(random);
  const summary = emptySummary();
  let specialEvent: EventData | null = null;

  // 3. 報酬処理・図鑑登録
  switch (entry.prize.kind) {
    case 'money':
      next = addMoney(next, entry.prize.amount, `運試し:${entry.id}`);
      summary.moneyDelta += entry.prize.amount;
      break;
    case 'item':
      next = giveItem(next, drawRandomItem(random).id, summary, now);
      break;
    case 'specialEvent':
      specialEvent = pickRandomEvent(next, now, random, { special: true });
      break;
    case 'nothing':
      break;
  }
  next = giveExperience(next, GAME_CONFIG.experience.luckGame, summary);
  next = { ...next, playCount: next.playCount + 1 };

  logger.info('LuckGame', `結果: ${entry.id}`, specialEvent ? `特殊イベント:${specialEvent.id}` : '');
  return { ok: true, player: next, entry, summary, specialEvent };
}
