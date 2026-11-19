import { ensureDailyMessage, getDailyMessageText } from '../src/core/dailyMessage';
import { createNewPlayer } from '../src/player/playerData';
import { DAILY_MESSAGES } from '../src/data/dailyMessages';

describe('今日の知らんけど', () => {
  test('同じ日は同じメッセージ、日付が変わると新しいメッセージ', () => {
    const day1 = new Date(2026, 10, 19, 9);
    const a = ensureDailyMessage(createNewPlayer('A'), day1, () => 0);
    expect(a.changed).toBe(true);
    const b = ensureDailyMessage(a.player, new Date(2026, 10, 19, 23, 59), () => 0.5);
    expect(b.changed).toBe(false);
    expect(getDailyMessageText(b.player)).toBe(DAILY_MESSAGES[0]);
    const c = ensureDailyMessage(b.player, new Date(2026, 10, 20, 0, 0), () => 0);
    expect(c.changed).toBe(true);
    expect(c.player.dailyMessage!.messageIndex).not.toBe(0); // 前日と同じにはしない
  });
});
