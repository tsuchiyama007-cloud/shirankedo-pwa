import { SAVE_KEYS, SaveManager, checksumOf, deserialize, serialize } from '../src/core/saveManager';
import { createNewPlayer } from '../src/player/playerData';
import { memoryStorage } from './helpers';

describe('セーブ・ロード', () => {
  test('セーブデータがないときは none', async () => {
    const { storage } = memoryStorage();
    const m = new SaveManager(storage);
    expect(await m.load()).toEqual({ status: 'none' });
    expect(await m.hasAnySave()).toBe(false);
  });

  test('保存して読み込める（一時データは残らない）', async () => {
    const { storage, data } = memoryStorage();
    const m = new SaveManager(storage);
    const p = { ...createNewPlayer('たろう'), money: 1234 };
    expect(await m.save(p)).toEqual({ ok: true });
    expect(data.has(SAVE_KEYS.tmp)).toBe(false);
    expect(await m.load()).toEqual({ status: 'ok', player: p });
  });

  test('上書き保存すると、ひとつ前のデータがバックアップに残る', async () => {
    const { storage, data } = memoryStorage();
    const m = new SaveManager(storage);
    await m.save({ ...createNewPlayer('A'), money: 1 });
    await m.save({ ...createNewPlayer('A'), money: 2 });
    expect(deserialize(data.get(SAVE_KEYS.main)!)!.money).toBe(2);
    expect(deserialize(data.get(SAVE_KEYS.backup)!)!.money).toBe(1);
  });

  test('メインが壊れていたらバックアップから復旧（壊れたデータも残す）', async () => {
    const { storage, data } = memoryStorage();
    const m = new SaveManager(storage);
    await m.save({ ...createNewPlayer('A'), money: 1 });
    await m.save({ ...createNewPlayer('A'), money: 2 });
    data.set(SAVE_KEYS.main, '{"broken":');
    const r = await m.load();
    expect(r.status).toBe('recovered');
    expect(r.status === 'recovered' && r.player.money).toBe(1);
    expect(data.get(`${SAVE_KEYS.main}.broken`)).toBe('{"broken":');
    expect(deserialize(data.get(SAVE_KEYS.main)!)!.money).toBe(1);
  });

  test('中身の改変・破損は検査値で検出する', () => {
    const text = serialize(createNewPlayer('A'));
    const tampered = text.replace('"money\\":1000', '"money\\":9999999');
    expect(tampered).not.toBe(text);
    expect(deserialize(tampered)).toBeNull();
    expect(checksumOf('abc')).toBe(checksumOf('abc'));
  });

  test('すべて壊れていたら error（データは消さない）', async () => {
    const { storage, data } = memoryStorage({ [SAVE_KEYS.main]: 'xxx', [SAVE_KEYS.backup]: 'yyy' });
    const m = new SaveManager(storage);
    expect(await m.load()).toEqual({ status: 'error' });
    expect(data.get(SAVE_KEYS.main)).toBe('xxx');
    expect(data.get(SAVE_KEYS.backup)).toBe('yyy');
    expect(await m.hasAnySave()).toBe(true);
  });

  test('保存に失敗してもメインデータは壊れない（例外も投げない）', async () => {
    const { storage, data, state } = memoryStorage();
    const m = new SaveManager(storage);
    await m.save({ ...createNewPlayer('A'), money: 1 });
    state.failOn = SAVE_KEYS.main;
    const r = await m.save({ ...createNewPlayer('A'), money: 2 });
    expect(r.ok).toBe(false);
    state.failOn = null;
    const loaded = await m.load();
    expect(loaded.status === 'ok' || loaded.status === 'recovered').toBe(true);
    expect('player' in loaded && loaded.player.money).toBeGreaterThanOrEqual(1);
    expect(deserialize(data.get(SAVE_KEYS.backup)!)!.money).toBe(1);
  });

  test('連続保存は呼んだ順に処理され、最後のデータが残る', async () => {
    const { storage } = memoryStorage();
    const m = new SaveManager(storage);
    await Promise.all([1, 2, 3, 4, 5].map((money) => m.save({ ...createNewPlayer('A'), money })));
    const r = await m.load();
    expect(r.status === 'ok' && r.player.money).toBe(5);
  });
});
