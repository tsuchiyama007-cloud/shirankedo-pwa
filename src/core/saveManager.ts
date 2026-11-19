import { logger } from './logger';
import { normalizePlayerData } from '../player/playerData';
import type { PlayerData } from './types';

/**
 * セーブ・ロード。
 *
 * 【保存の手順】（途中で失敗・アプリ終了してもデータが壊れないように）
 *  1. まず一時領域（tmp）に書く
 *  2. tmp を読み戻して、正しく書けたか確認する
 *  3. 今のメインデータをバックアップ（backup）へ写す
 *  4. メインデータ（main）を書き換える
 *  5. tmp を消す
 *
 * 【読み込みの手順】
 *  main → backup → tmp の順に確認し、正しいものを使う。
 *  backup などから復旧したときは main を書き直す。
 *  どれも読めないときは「エラー」を返す。データを勝手に消したり初期化したりはしない。
 *
 * 保存先（storage）は差し替え可能。アプリでは AsyncStorage、テストではメモリ上の入れ物を使う。
 */

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const SAVE_KEYS = {
  main: 'shirankedo.save.main',
  backup: 'shirankedo.save.backup',
  tmp: 'shirankedo.save.tmp',
} as const;

/** セーブデータの形式の版。形式を変えたら上げて、normalizePlayerData で古い版を読めるようにする */
export const SAVE_FORMAT_VERSION = 1;

type SaveEnvelope = {
  formatVersion: number;
  savedAt: string;
  /** data の文字列から計算した検査値（壊れていないかの確認用） */
  checksum: string;
  data: string;
};

/** 文字列の検査値（FNV-1a 32bit）。暗号用ではなく、破損の検出用 */
export function checksumOf(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

export function serialize(player: PlayerData, now: Date = new Date()): string {
  const data = JSON.stringify(player);
  const envelope: SaveEnvelope = { formatVersion: SAVE_FORMAT_VERSION, savedAt: now.toISOString(), checksum: checksumOf(data), data };
  return JSON.stringify(envelope);
}

/** 保存文字列を PlayerData に戻す。壊れていれば null */
export function deserialize(text: string | null): PlayerData | null {
  if (!text) return null;
  try {
    const envelope = JSON.parse(text) as Partial<SaveEnvelope>;
    if (typeof envelope.data !== 'string' || typeof envelope.checksum !== 'string') return null;
    if (checksumOf(envelope.data) !== envelope.checksum) return null;
    return normalizePlayerData(JSON.parse(envelope.data));
  } catch {
    return null;
  }
}

export type LoadResult =
  | { status: 'ok'; player: PlayerData }
  | { status: 'recovered'; player: PlayerData; from: 'backup' | 'tmp' }
  | { status: 'none' }
  | { status: 'error' };

export type SaveResult = { ok: true } | { ok: false; error: unknown };

export class SaveManager {
  /** 保存を1件ずつ順番に行うための待ち行列 */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly storage: KeyValueStorage) {}

  /** セーブデータが存在するか（中身が壊れていても「ある」とみなす＝勝手に上書きしないため） */
  async hasAnySave(): Promise<boolean> {
    for (const key of [SAVE_KEYS.main, SAVE_KEYS.backup, SAVE_KEYS.tmp]) {
      try {
        if (await this.storage.getItem(key)) return true;
      } catch {
        // 読み取り自体の失敗は「あるかもしれない」とみなす
        return true;
      }
    }
    return false;
  }

  async load(): Promise<LoadResult> {
    let raw: Record<'main' | 'backup' | 'tmp', string | null>;
    try {
      raw = {
        main: await this.storage.getItem(SAVE_KEYS.main),
        backup: await this.storage.getItem(SAVE_KEYS.backup),
        tmp: await this.storage.getItem(SAVE_KEYS.tmp),
      };
    } catch (error) {
      logger.error('SaveManager', '読み込みに失敗しました', error);
      return { status: 'error' };
    }

    if (!raw.main && !raw.backup && !raw.tmp) return { status: 'none' };

    const main = deserialize(raw.main);
    if (main) return { status: 'ok', player: main };

    for (const from of ['backup', 'tmp'] as const) {
      const player = deserialize(raw[from]);
      if (player) {
        logger.warn('SaveManager', `メインデータが読めないため、${from} から復旧します`);
        // 壊れたメインデータは、念のため別名で残す
        if (raw.main) await this.storage.setItem(`${SAVE_KEYS.main}.broken`, raw.main).catch(() => undefined);
        await this.save(player);
        return { status: 'recovered', player, from };
      }
    }
    logger.error('SaveManager', 'メイン・バックアップともに読み込めませんでした');
    return { status: 'error' };
  }

  /** 保存する（呼ばれた順に1件ずつ実行される） */
  save(player: PlayerData): Promise<SaveResult> {
    const run = this.queue.then(() => this.saveNow(player));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async saveNow(player: PlayerData): Promise<SaveResult> {
    try {
      const text = serialize(player);
      await this.storage.setItem(SAVE_KEYS.tmp, text);
      const check = await this.storage.getItem(SAVE_KEYS.tmp);
      if (check !== text || !deserialize(check)) throw new Error('一時データの確認に失敗しました');

      const currentMain = await this.storage.getItem(SAVE_KEYS.main);
      if (currentMain && deserialize(currentMain)) await this.storage.setItem(SAVE_KEYS.backup, currentMain);

      await this.storage.setItem(SAVE_KEYS.main, text);
      await this.storage.removeItem(SAVE_KEYS.tmp);
      logger.debug('SaveManager', '保存しました');
      return { ok: true };
    } catch (error) {
      logger.error('SaveManager', '保存に失敗しました', error);
      return { ok: false, error };
    }
  }
}
