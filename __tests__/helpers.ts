import type { RandomSource } from '../src/core/random';
import type { KeyValueStorage } from '../src/core/saveManager';

/** 決まった値を順番に返す乱数（テスト用） */
export function sequenceRandom(...values: number[]): RandomSource {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

/** メモリ上の保存先（テスト用）。failOn を指定するとそのキーへの書き込みで失敗する */
export function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const state = { failOn: null as string | null };
  const storage: KeyValueStorage = {
    async getItem(key) {
      return data.has(key) ? data.get(key)! : null;
    },
    async setItem(key, value) {
      if (state.failOn === key) throw new Error('disk full');
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
  return { storage, data, state };
}
