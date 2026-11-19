import { addMoney, canAfford, spendMoney } from '../src/currency/currencyManager';
import { createNewPlayer } from '../src/player/playerData';
import { GAME_CONFIG } from '../src/config/gameConfig';

const withMoney = (money: number) => ({ ...createNewPlayer('A'), money });

describe('お金', () => {
  test('加算', () => expect(addMoney(withMoney(0), 100, 't').money).toBe(100));
  test('減算', () => {
    const r = spendMoney(withMoney(1000), 100, 't');
    expect(r.ok && r.player.money).toBe(900);
  });
  test('ちょうど0円になる支払いはOK', () => {
    const r = spendMoney(withMoney(100), 100, 't');
    expect(r.ok && r.player.money).toBe(0);
  });
  test('所持金不足は失敗し、所持金は変わらない', () => {
    const p = withMoney(99);
    expect(canAfford(p, 100)).toBe(false);
    expect(spendMoney(p, 100, 't')).toEqual({ ok: false, reason: 'insufficient' });
    expect(p.money).toBe(99);
  });
  test('不正な金額（マイナス・NaN）は無視', () => {
    expect(addMoney(withMoney(10), -5, 't').money).toBe(10);
    expect(addMoney(withMoney(10), Number.NaN, 't').money).toBe(10);
    expect(spendMoney(withMoney(10), -5, 't').ok).toBe(false);
  });
  test('大きな金額：上限で止まる', () => {
    expect(addMoney(withMoney(GAME_CONFIG.maxMoney - 1), 1_000_000, 't').money).toBe(GAME_CONFIG.maxMoney);
  });
});
