import { DAILY_MESSAGES } from '../data/dailyMessages';
import { toLocalDateKey } from './dateUtil';
import { defaultRandom, type RandomSource } from './random';
import type { PlayerData } from './types';

/**
 * 「今日の知らんけど」。日付が変わったときだけ新しいメッセージを選ぶ。
 * changed が true のときだけ保存が必要。
 */
export function ensureDailyMessage(
  player: PlayerData,
  now: Date = new Date(),
  random: RandomSource = defaultRandom,
): { player: PlayerData; changed: boolean } {
  const today = toLocalDateKey(now);
  const current = player.dailyMessage;
  if (current && current.date === today && current.messageIndex >= 0 && current.messageIndex < DAILY_MESSAGES.length) {
    return { player, changed: false };
  }
  let index = Math.floor(random() * DAILY_MESSAGES.length);
  // 昨日と同じメッセージが続かないようにする
  if (current && index === current.messageIndex && DAILY_MESSAGES.length > 1) index = (index + 1) % DAILY_MESSAGES.length;
  return { player: { ...player, dailyMessage: { date: today, messageIndex: index } }, changed: true };
}

export function getDailyMessageText(player: PlayerData): string {
  const index = player.dailyMessage?.messageIndex ?? 0;
  return DAILY_MESSAGES[index] ?? DAILY_MESSAGES[0];
}
