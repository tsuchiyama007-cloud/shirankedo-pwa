import { GAME_CONFIG } from '../config/gameConfig';
import { logger } from '../core/logger';
import type { PlayerData } from '../core/types';

/**
 * お金の増減は、必ずこのファイルの関数を通す（money を直接書き換えない）。
 * 所持金不足・上限・ログをここでまとめて扱う。
 * 関数は PlayerData を書き換えず、新しい PlayerData を返す。
 */

export function canAfford(player: PlayerData, amount: number): boolean {
  return amount <= 0 || player.money >= amount;
}

/** お金を増やす（上限を超えた分は切り捨て） */
export function addMoney(player: PlayerData, amount: number, reason: string): PlayerData {
  if (!Number.isFinite(amount) || amount < 0) {
    logger.warn('CurrencyManager', `addMoney に不正な金額: ${amount}（${reason}）`);
    return player;
  }
  const money = Math.min(GAME_CONFIG.maxMoney, player.money + Math.floor(amount));
  logger.debug('CurrencyManager', `+${amount}円（${reason}） → ${money}円`);
  return { ...player, money };
}

export type SpendResult = { ok: true; player: PlayerData } | { ok: false; reason: 'insufficient' | 'invalid' };

/** お金を使う。所持金が足りないときは何も変えずに失敗を返す */
export function spendMoney(player: PlayerData, amount: number, reason: string): SpendResult {
  if (!Number.isFinite(amount) || amount < 0) {
    logger.warn('CurrencyManager', `spendMoney に不正な金額: ${amount}（${reason}）`);
    return { ok: false, reason: 'invalid' };
  }
  if (!canAfford(player, amount)) return { ok: false, reason: 'insufficient' };
  const money = player.money - Math.floor(amount);
  logger.debug('CurrencyManager', `-${amount}円（${reason}） → ${money}円`);
  return { ok: true, player: { ...player, money } };
}

/** 増減をまとめて適用する（プラスは addMoney、マイナスは spendMoney） */
export function applyMoneyDelta(player: PlayerData, delta: number, reason: string): SpendResult {
  if (delta >= 0) return { ok: true, player: addMoney(player, delta, reason) };
  return spendMoney(player, -delta, reason);
}
