import { logger } from '../core/logger';
import type { PlayerData } from '../core/types';
import { getItem } from './itemManager';

/** 所持アイテムの増減。存在しないアイテムIDは無視する（クラッシュさせない） */

export function getItemCount(player: PlayerData, itemId: string): number {
  return player.items[itemId] ?? 0;
}

export function addItem(player: PlayerData, itemId: string, count = 1): PlayerData {
  if (!getItem(itemId) || count <= 0) return player;
  const items = { ...player.items, [itemId]: getItemCount(player, itemId) + count };
  logger.debug('ItemManager', `アイテム追加: ${itemId} x${count}`);
  return { ...player, items };
}

export type RemoveResult = { ok: true; player: PlayerData } | { ok: false };

export function removeItem(player: PlayerData, itemId: string, count = 1): RemoveResult {
  const owned = getItemCount(player, itemId);
  if (count <= 0 || owned < count) return { ok: false };
  const items = { ...player.items };
  if (owned === count) delete items[itemId];
  else items[itemId] = owned - count;
  return { ok: true, player: { ...player, items } };
}

/** 所持しているアイテムの一覧（定義の順） */
export function listOwnedItems(player: PlayerData) {
  return Object.entries(player.items)
    .map(([id, count]) => ({ item: getItem(id), count }))
    .filter((e): e is { item: NonNullable<ReturnType<typeof getItem>>; count: number } => e.item !== null && e.count > 0);
}
