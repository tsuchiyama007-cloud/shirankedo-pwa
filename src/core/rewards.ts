import { GAME_CONFIG } from '../config/gameConfig';
import { applyMoneyDelta } from '../currency/currencyManager';
import { discoverItem } from '../collection/collectionManager';
import { addItem } from '../items/inventoryManager';
import { getItem } from '../items/itemManager';
import { addExperience } from '../player/playerLevelSystem';
import type { EventOutcome, ItemData, PlayerData } from './types';

/** 報酬をまとめて適用した結果（画面表示用） */
export type RewardSummary = {
  moneyDelta: number;
  items: { item: ItemData; isNew: boolean }[];
  experience: number;
  levelsGained: number;
};

export const emptySummary = (): RewardSummary => ({ moneyDelta: 0, items: [], experience: 0, levelsGained: 0 });

/** アイテムを渡し、初めてなら図鑑に登録する */
export function giveItem(player: PlayerData, itemId: string, summary: RewardSummary, now: Date): PlayerData {
  const item = getItem(itemId);
  if (!item) return player;
  let next = addItem(player, itemId, 1);
  const found = discoverItem(next, itemId, now);
  next = found.player;
  summary.items.push({ item, isNew: found.isNew });
  if (found.isNew) next = giveExperience(next, GAME_CONFIG.experience.firstDiscoveryBonus, summary);
  return next;
}

export function giveExperience(player: PlayerData, amount: number, summary: RewardSummary): PlayerData {
  const result = addExperience(player, amount);
  summary.experience += amount;
  summary.levelsGained += result.levelsGained;
  return result.player;
}

export type ApplyOutcomeResult = { ok: true; player: PlayerData } | { ok: false; reason: 'insufficient' };

/** イベント結果（お金・アイテム・経験値）を適用する。お金が足りないときは何も変えない */
export function applyOutcome(
  player: PlayerData,
  outcome: EventOutcome,
  reason: string,
  summary: RewardSummary,
  now: Date,
): ApplyOutcomeResult {
  let next = player;
  if (outcome.moneyDelta) {
    const paid = applyMoneyDelta(next, outcome.moneyDelta, reason);
    if (!paid.ok) return { ok: false, reason: 'insufficient' };
    next = paid.player;
    summary.moneyDelta += outcome.moneyDelta;
  }
  if (outcome.itemId) next = giveItem(next, outcome.itemId, summary, now);
  if (outcome.experience) next = giveExperience(next, outcome.experience, summary);
  return { ok: true, player: next };
}
