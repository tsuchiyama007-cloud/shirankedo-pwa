import { canPlayLuckGame, luckProbabilities, playLuckGame } from '../src/minigames/luckGame';
import { LUCK_TABLE } from '../src/data/luckTable';
import { createNewPlayer } from '../src/player/playerData';
import { GAME_CONFIG } from '../src/config/gameConfig';
import { sequenceRandom } from './helpers';

const withMoney = (money: number) => ({ ...createNewPlayer('A'), money });
/** 抽選表の i 番目がちょうど当たる乱数の値 */
function randomFor(id: string): number {
  const total = LUCK_TABLE.reduce((s, e) => s + e.weight, 0);
  let acc = 0;
  for (const e of LUCK_TABLE) {
    if (e.id === id) return (acc + e.weight / 2) / total;
    acc += e.weight;
  }
  throw new Error(id);
}

describe('運試し', () => {
  test('TC-003 所持金100円で運試し → 100円消費（何も起きない場合は0円）', () => {
    const r = playLuckGame(withMoney(100), 'money', sequenceRandom(randomFor('nothing')));
    expect(r.ok && r.player.money).toBe(0);
    expect(r.ok && r.entry.id).toBe('nothing');
  });

  test('TC-004 所持金99円では運試しできない（所持金は変わらない）', () => {
    const p = withMoney(99);
    expect(canPlayLuckGame(p, 'money')).toBe(false);
    expect(playLuckGame(p)).toEqual({ ok: false, reason: 'insufficient' });
    expect(p.money).toBe(99);
  });

  test('お金が当たると料金を引いたうえで加算される', () => {
    const r = playLuckGame(withMoney(1000), 'money', sequenceRandom(randomFor('money_1000')));
    expect(r.ok && r.player.money).toBe(1000 - GAME_CONFIG.luckGameCost + 1000);
  });

  test('100万円も当たる', () => {
    const r = playLuckGame(withMoney(100), 'money', sequenceRandom(randomFor('money_1000000')));
    expect(r.ok && r.player.money).toBe(1_000_000);
  });

  test('アイテムが当たると所持品と図鑑に入る（NEW!は初回のみ）', () => {
    const r1 = playLuckGame(withMoney(1000), 'money', sequenceRandom(randomFor('item'), 0, 0));
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    const got = r1.summary.items[0];
    expect(got.isNew).toBe(true);
    expect(r1.player.items[got.item.id]).toBe(1);
    expect(r1.player.discoveredItems.map((d) => d.id)).toEqual([got.item.id]);
    const r2 = playLuckGame(r1.player, 'money', sequenceRandom(randomFor('item'), 0, 0));
    expect(r2.ok && r2.summary.items[0].isNew).toBe(false);
    expect(r2.ok && r2.player.discoveredItems.length).toBe(1);
  });

  test('特殊イベントが当たると特殊イベント専用のイベントが返る', () => {
    const r = playLuckGame(withMoney(1000), 'money', sequenceRandom(randomFor('special_event'), 0));
    expect(r.ok && r.specialEvent?.specialOnly).toBe(true);
  });

  test('無料チケット：お金を使わずに1回、チケットは1枚減る', () => {
    const p = { ...withMoney(0), freeLuckTickets: 1 };
    expect(canPlayLuckGame(p, 'freeTicket')).toBe(true);
    const r = playLuckGame(p, 'freeTicket', sequenceRandom(randomFor('nothing')));
    expect(r.ok && r.player).toMatchObject({ money: 0, freeLuckTickets: 0 });
    expect(playLuckGame({ ...p, freeLuckTickets: 0 }, 'freeTicket').ok).toBe(false);
  });

  test('元のデータは書き換えない（二重消費の防止）', () => {
    const p = withMoney(1000);
    playLuckGame(p);
    expect(p.money).toBe(1000);
  });

  test('確率の合計は100%', () => {
    const sum = luckProbabilities().reduce((s, e) => s + e.percent, 0);
    expect(sum).toBeCloseTo(100, 6);
  });

  test('多数回の抽選で、出る割合が設定の確率に近い', () => {
    let rnd = 12345;
    const random = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
    const counts: Record<string, number> = {};
    let p = { ...withMoney(GAME_CONFIG.maxMoney) };
    const N = 50000;
    for (let i = 0; i < N; i++) {
      const r = playLuckGame(p, 'money', random);
      if (!r.ok) throw new Error();
      counts[r.entry.id] = (counts[r.entry.id] ?? 0) + 1;
      p = { ...r.player, money: GAME_CONFIG.maxMoney };
    }
    for (const { entry, percent } of luckProbabilities()) {
      if (percent < 1) continue;
      expect(Math.abs(((counts[entry.id] ?? 0) / N) * 100 - percent)).toBeLessThan(1);
    }
  });
});
