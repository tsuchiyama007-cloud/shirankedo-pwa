import { GAME_CONFIG } from '../config/gameConfig';
import type { PlayerData, Settings } from '../core/types';

export const DEFAULT_SETTINGS: Settings = {
  bgm: true,
  se: true,
  vibration: true,
  notification: false,
};

export type NameCheck = { ok: true; name: string } | { ok: false; message: string };

/** 見えない文字・制御文字（改行・ゼロ幅文字など）。名前からは取り除く */
const INVISIBLE_CHARS = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g;

/** 文字数を「見た目の1文字」で数える（絵文字なども1文字） */
export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/**
 * プレイヤー名のチェック。
 * - 前後の空白・見えない文字を取り除く
 * - 空欄は禁止
 * - 最大12文字
 */
export function validatePlayerName(raw: string): NameCheck {
  const name = (raw ?? '').replace(INVISIBLE_CHARS, '').replace(/\s+/g, ' ').trim();
  if (name.length === 0) return { ok: false, message: '名前を入力してください。' };
  if (countCharacters(name) > GAME_CONFIG.playerNameMaxLength) {
    return { ok: false, message: `名前は${GAME_CONFIG.playerNameMaxLength}文字までです。` };
  }
  return { ok: true, name };
}

/** 新しいプレイヤーデータを作る */
export function createNewPlayer(name: string, now: Date = new Date()): PlayerData {
  return {
    playerName: name,
    money: GAME_CONFIG.initialMoney,
    level: 1,
    experience: 0,
    items: {},
    discoveredEvents: [],
    discoveredItems: [],
    playCount: 0,
    settings: { ...DEFAULT_SETTINGS },
    dailyMessage: null,
    randomEventCounter: null,
    freeLuckTickets: 0,
    createdAt: now.toISOString(),
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const toInt = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : fallback);

/**
 * 読み込んだデータを、今のバージョンの PlayerData に整える。
 * - 将来項目が増えても、古いセーブデータは足りない項目を初期値で補って読み込める
 * - 明らかに壊れている（名前がない等）ときは null を返す
 */
export function normalizePlayerData(raw: unknown): PlayerData | null {
  if (!isObject(raw)) return null;
  if (typeof raw.playerName !== 'string' || raw.playerName.trim() === '') return null;

  const base = createNewPlayer(raw.playerName);
  const items: Record<string, number> = {};
  if (isObject(raw.items)) {
    for (const [id, count] of Object.entries(raw.items)) {
      const n = toInt(count, 0);
      if (n > 0) items[id] = n;
    }
  }
  const records = (v: unknown) =>
    Array.isArray(v)
      ? v
          .filter((r) => isObject(r) && typeof r.id === 'string')
          .map((r) => ({ id: String((r as Record<string, unknown>).id), discoveredAt: String((r as Record<string, unknown>).discoveredAt ?? '') }))
      : [];
  const settings = isObject(raw.settings) ? raw.settings : {};
  const daily = isObject(raw.dailyMessage) ? raw.dailyMessage : null;
  const counter = isObject(raw.randomEventCounter) ? raw.randomEventCounter : null;

  return {
    ...base,
    money: Math.max(0, Math.min(GAME_CONFIG.maxMoney, toInt(raw.money, base.money))),
    level: Math.max(1, toInt(raw.level, 1)),
    experience: Math.max(0, toInt(raw.experience, 0)),
    items,
    discoveredEvents: records(raw.discoveredEvents),
    discoveredItems: records(raw.discoveredItems),
    playCount: Math.max(0, toInt(raw.playCount, 0)),
    settings: {
      bgm: typeof settings.bgm === 'boolean' ? settings.bgm : DEFAULT_SETTINGS.bgm,
      se: typeof settings.se === 'boolean' ? settings.se : DEFAULT_SETTINGS.se,
      vibration: typeof settings.vibration === 'boolean' ? settings.vibration : DEFAULT_SETTINGS.vibration,
      notification: typeof settings.notification === 'boolean' ? settings.notification : DEFAULT_SETTINGS.notification,
    },
    dailyMessage:
      daily && typeof daily.date === 'string' ? { date: daily.date, messageIndex: toInt(daily.messageIndex, 0) } : null,
    randomEventCounter:
      counter && typeof counter.date === 'string' ? { date: counter.date, count: Math.max(0, toInt(counter.count, 0)) } : null,
    freeLuckTickets: Math.max(0, toInt(raw.freeLuckTickets, 0)),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : base.createdAt,
  };
}
