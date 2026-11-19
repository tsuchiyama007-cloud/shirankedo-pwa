import type { DiscoveryRecord, PlayerData } from '../core/types';

/**
 * 図鑑（イベント図鑑・アイテム図鑑）。
 * 初めて見つけたときだけ登録し、isNew: true を返す（NEW! 演出用）。重複登録はしない。
 */

export type DiscoveryResult = { player: PlayerData; isNew: boolean };

const has = (list: DiscoveryRecord[], id: string) => list.some((r) => r.id === id);

export function discoverEvent(player: PlayerData, eventId: string, now: Date = new Date()): DiscoveryResult {
  if (has(player.discoveredEvents, eventId)) return { player, isNew: false };
  return {
    player: { ...player, discoveredEvents: [...player.discoveredEvents, { id: eventId, discoveredAt: now.toISOString() }] },
    isNew: true,
  };
}

export function discoverItem(player: PlayerData, itemId: string, now: Date = new Date()): DiscoveryResult {
  if (has(player.discoveredItems, itemId)) return { player, isNew: false };
  return {
    player: { ...player, discoveredItems: [...player.discoveredItems, { id: itemId, discoveredAt: now.toISOString() }] },
    isNew: true,
  };
}

export function findDiscovery(list: DiscoveryRecord[], id: string): DiscoveryRecord | null {
  return list.find((r) => r.id === id) ?? null;
}
