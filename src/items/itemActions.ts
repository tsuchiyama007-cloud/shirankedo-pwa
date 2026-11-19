import { addMoney, applyMoneyDelta } from '../currency/currencyManager';
import { emptySummary, giveExperience, type RewardSummary } from '../core/rewards';
import type { PlayerData } from '../core/types';
import { getItemCount, removeItem } from './inventoryManager';
import { getItem } from './itemManager';

/** 持ち物画面の「使う」「売る」 */

export type ItemActionResult =
  | { ok: true; player: PlayerData; message: string; summary: RewardSummary }
  | { ok: false; message: string };

export function consumeItem(player: PlayerData, itemId: string): ItemActionResult {
  const item = getItem(itemId);
  if (!item || !item.usable || !item.useEffect) return { ok: false, message: 'このアイテムは使えません。' };
  const removed = removeItem(player, itemId, 1);
  if (!removed.ok) return { ok: false, message: 'このアイテムを持っていません。' };

  const summary = emptySummary();
  let next = removed.player;
  if (item.useEffect.moneyDelta) {
    const paid = applyMoneyDelta(next, item.useEffect.moneyDelta, `アイテム使用:${itemId}`);
    if (!paid.ok) return { ok: false, message: 'お金が足りません。' };
    next = paid.player;
    summary.moneyDelta += item.useEffect.moneyDelta;
  }
  if (item.useEffect.experience) next = giveExperience(next, item.useEffect.experience, summary);
  return { ok: true, player: next, message: item.useEffect.message, summary };
}

export function sellItem(player: PlayerData, itemId: string, count = 1): ItemActionResult {
  const item = getItem(itemId);
  if (!item || !item.sellable) return { ok: false, message: 'このアイテムは売れません。' };
  if (count <= 0 || getItemCount(player, itemId) < count) return { ok: false, message: 'このアイテムを持っていません。' };
  const removed = removeItem(player, itemId, count);
  if (!removed.ok) return { ok: false, message: 'このアイテムを持っていません。' };
  const earned = item.sellPrice * count;
  const summary = { ...emptySummary(), moneyDelta: earned };
  return { ok: true, player: addMoney(removed.player, earned, `売却:${itemId}`), message: `${item.name}を売った。`, summary };
}
