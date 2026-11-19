/**
 * ゲームで使うデータの「形」をまとめたファイル。
 * セーブデータに入るものは PlayerData にまとめる。
 */

/** 設定（ON/OFF） */
export type Settings = {
  bgm: boolean;
  se: boolean;
  vibration: boolean;
  notification: boolean;
};

/** 図鑑に登録された記録（発見日時は ISO 形式の文字列） */
export type DiscoveryRecord = {
  id: string;
  discoveredAt: string;
};

/** 「今日の知らんけど」の記録 */
export type DailyMessageState = {
  /** 表示した日付（端末の現地時間で YYYY-MM-DD） */
  date: string;
  messageIndex: number;
};

/** 1日ごとの回数制限の記録 */
export type DailyCounter = {
  date: string;
  count: number;
};

/** セーブデータに保存するプレイヤー情報 */
export type PlayerData = {
  playerName: string;
  money: number;
  level: number;
  /** 現在のレベルで貯まっている経験値（レベルアップで繰り越し） */
  experience: number;
  /** 所持アイテム：アイテムID → 所持数 */
  items: Record<string, number>;
  discoveredEvents: DiscoveryRecord[];
  discoveredItems: DiscoveryRecord[];
  /** 運試し・イベントを遊んだ回数 */
  playCount: number;
  settings: Settings;
  dailyMessage: DailyMessageState | null;
  randomEventCounter: DailyCounter | null;
  /** 広告を見て得た「無料の運試し」の残り回数 */
  freeLuckTickets: number;
  createdAt: string;
};

export type Rarity = 'N' | 'R' | 'SR' | 'UR';

/** アイテムの定義（data/items.ts） */
export type ItemData = {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  /** アイコン（絵文字） */
  icon: string;
  sellPrice: number;
  usable: boolean;
  sellable: boolean;
  /** 使ったときの効果（usable のときのみ） */
  useEffect?: {
    moneyDelta?: number;
    experience?: number;
    message: string;
  };
};

/** イベントの発生条件（すべて省略可。書いた条件をすべて満たすと発生候補になる） */
export type EventCondition = {
  minimumMoney?: number;
  minimumLevel?: number;
  requiredItem?: string;
  requiredEvent?: string;
  minimumPlayCount?: number;
  /** 発生する日付（MM-DD の配列） */
  dates?: string[];
  /** 発生する時間帯（0〜23時）。startHour > endHour のときは日をまたぐ（例：22〜3時） */
  timeRange?: { startHour: number; endHour: number };
};

/** イベントや選択肢の結果 */
export type EventOutcome = {
  message: string;
  moneyDelta?: number;
  itemId?: string;
  experience?: number;
};

/** 結果が複数ある場合（重みで抽選） */
export type WeightedOutcome = { weight: number; outcome: EventOutcome };

export type EventChoice = {
  label: string;
  /** 結果が1つのとき */
  outcome?: EventOutcome;
  /** 結果をランダムにしたいとき（outcome より優先） */
  outcomes?: WeightedOutcome[];
};

/** イベントの定義（data/events.ts） */
export type EventData = {
  id: string;
  title: string;
  icon: string;
  description: string;
  /** 発生しやすさ（重み）。大きいほど出やすい */
  weight: number;
  conditions?: EventCondition;
  /** choice：選択肢あり／auto：そのまま結果 */
  type: 'choice' | 'auto';
  choices?: EventChoice[];
  outcome?: EventOutcome;
  outcomes?: WeightedOutcome[];
  /** 運試しの「特殊イベント」からだけ発生する */
  specialOnly?: boolean;
};

/** 運試しの抽選結果の種類 */
export type LuckPrize =
  | { kind: 'money'; amount: number }
  | { kind: 'item' }
  | { kind: 'specialEvent' }
  | { kind: 'nothing' };

export type LuckTableEntry = {
  id: string;
  label: string;
  /** 発生しやすさ（重み） */
  weight: number;
  prize: LuckPrize;
};
