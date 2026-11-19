import { ITEMS, ITEM_DROP_RARITY_WEIGHTS } from '../data/items';
import { logger } from '../core/logger';
import { pickWeighted, type RandomSource, defaultRandom } from '../core/random';
import type { ItemData, Rarity } from '../core/types';

/** アイテムの定義を探す。存在しない ID のときは null（エラーで止めない） */
const ITEM_MAP: ReadonlyMap<string, ItemData> = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id: string): ItemData | null {
  const item = ITEM_MAP.get(id);
  if (!item) logger.warn('ItemManager', `存在しないアイテムID: ${id}`);
  return item ?? null;
}

export function getAllItems(): readonly ItemData[] {
  return ITEMS;
}

/** 運試しの「アイテム」当選時に渡すアイテムを抽選（まずレア度、次にそのレア度の中から） */
export function drawRandomItem(random: RandomSource = defaultRandom): ItemData {
  const rarities = (Object.keys(ITEM_DROP_RARITY_WEIGHTS) as Rarity[]).filter((r) => ITEMS.some((i) => i.rarity === r));
  const rarity = pickWeighted(rarities, (r) => ITEM_DROP_RARITY_WEIGHTS[r], random) ?? 'N';
  const candidates = ITEMS.filter((i) => i.rarity === rarity);
  return pickWeighted(candidates, () => 1, random) ?? ITEMS[0];
}
