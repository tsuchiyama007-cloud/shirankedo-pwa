import { createNewPlayer, normalizePlayerData, validatePlayerName } from '../src/player/playerData';
import { addExperience, requiredExperience } from '../src/player/playerLevelSystem';
import { MAX_LEVEL } from '../src/config/gameConfig';

describe('プレイヤー', () => {
  test('初期データ：所持金1000円・レベル1・経験値0', () => {
    const p = createNewPlayer('テスト');
    expect(p).toMatchObject({ playerName: 'テスト', money: 1000, level: 1, experience: 0, playCount: 0, items: {} });
  });

  test('名前：空欄・空白だけは禁止', () => {
    expect(validatePlayerName('').ok).toBe(false);
    expect(validatePlayerName('   ').ok).toBe(false);
    expect(validatePlayerName('\u200B\n').ok).toBe(false);
  });

  test('名前：12文字までOK、13文字はNG（絵文字も1文字）', () => {
    expect(validatePlayerName('あいうえおかきくけこさし')).toEqual({ ok: true, name: 'あいうえおかきくけこさし' });
    expect(validatePlayerName('あいうえおかきくけこさしす').ok).toBe(false);
    expect(validatePlayerName('😀😀😀😀😀😀😀😀😀😀😀😀').ok).toBe(true);
  });

  test('名前：前後の空白・改行・見えない文字を取り除く', () => {
    expect(validatePlayerName('  たろう\n\u200B ')).toEqual({ ok: true, name: 'たろう' });
  });

  test('レベルアップ：100XPでレベル2、余りは繰り越し', () => {
    const p = createNewPlayer('A');
    expect(addExperience(p, 99).player.level).toBe(1);
    const r = addExperience(p, 120);
    expect(r.player).toMatchObject({ level: 2, experience: 20 });
    expect(r.levelsGained).toBe(1);
  });

  test('レベルアップ：一度に複数レベル上がる（100+250+450）', () => {
    const r = addExperience(createNewPlayer('A'), 800);
    expect(r.player).toMatchObject({ level: 4, experience: 0 });
    expect(r.levelsGained).toBe(3);
  });

  test('必要経験値は表より上でも増え続け、上限レベルで止まる', () => {
    expect(requiredExperience(11)).toBeGreaterThan(requiredExperience(10));
    const r = addExperience(createNewPlayer('A'), 10_000_000);
    expect(r.player.level).toBe(MAX_LEVEL);
  });

  test('古い・欠けたセーブデータも補って読める／壊れたデータは null', () => {
    const p = normalizePlayerData({ playerName: 'B', money: 50 });
    expect(p).toMatchObject({ playerName: 'B', money: 50, level: 1, settings: { bgm: true } });
    expect(normalizePlayerData({ money: 1 })).toBeNull();
    expect(normalizePlayerData('x')).toBeNull();
    expect(normalizePlayerData({ playerName: 'C', items: { a: -1, b: 2 } })!.items).toEqual({ b: 2 });
  });
});
