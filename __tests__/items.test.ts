import { addItem, getItemCount, listOwnedItems, removeItem } from '../src/items/inventoryManager';
import { sellItem, consumeItem } from '../src/items/itemActions';
import { drawRandomItem, getItem } from '../src/items/itemManager';
import { ITEMS } from '../src/data/items';
import { createNewPlayer } from '../src/player/playerData';

describe('アイテム', () => {
  test('TC-005 アイテムを取得するとインベントリに追加される', () => {
    const p = addItem(createNewPlayer('A'), 'rubber_duck');
    expect(getItemCount(p, 'rubber_duck')).toBe(1);
    expect(listOwnedItems(p).map((e) => e.item.id)).toEqual(['rubber_duck']);
  });
  test('重複して取得すると所持数が増える', () => {
    const p = addItem(addItem(createNewPlayer('A'), 'rubber_duck'), 'rubber_duck');
    expect(getItemCount(p, 'rubber_duck')).toBe(2);
  });
  test('存在しないアイテムIDは無視（クラッシュしない）', () => {
    const p = createNewPlayer('A');
    expect(addItem(p, 'no_such_item')).toBe(p);
    expect(getItem('no_such_item')).toBeNull();
    expect(listOwnedItems({ ...p, items: { no_such_item: 3 } })).toEqual([]);
  });
  test('使用：1個減って効果が出る', () => {
    const p = addItem(createNewPlayer('A'), 'mystery_drink');
    const r = consumeItem(p, 'mystery_drink');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(getItemCount(r.player, 'mystery_drink')).toBe(0);
      expect(r.player.experience).toBe(30);
    }
  });
  test('使えないアイテム・持っていないアイテムは使えない', () => {
    expect(consumeItem(addItem(createNewPlayer('A'), 'rubber_duck'), 'rubber_duck').ok).toBe(false);
    expect(consumeItem(createNewPlayer('A'), 'mystery_drink').ok).toBe(false);
  });
  test('売却：お金が増えて所持数が減る／売れないものは売れない', () => {
    const p = addItem(addItem(createNewPlayer('A'), 'rubber_duck'), 'receipt');
    const r = sellItem(p, 'rubber_duck');
    expect(r.ok && r.player.money).toBe(1050);
    expect(r.ok && getItemCount(r.player, 'rubber_duck')).toBe(0);
    expect(sellItem(p, 'receipt').ok).toBe(false);
    expect(removeItem(p, 'rubber_duck', 5).ok).toBe(false);
  });
  test('アイテム定義：IDの重複なし、売れるものは売値0以上、使えるものは効果あり', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    for (const i of ITEMS) {
      expect(i.sellPrice).toBeGreaterThanOrEqual(0);
      if (i.usable) expect(i.useEffect).toBeDefined();
    }
  });
  test('ランダムなアイテム抽選は必ず定義済みのアイテムを返す', () => {
    for (const v of [0, 0.3, 0.7, 0.99, 0.999999]) expect(getItem(drawRandomItem(() => v).id)).not.toBeNull();
  });
});
