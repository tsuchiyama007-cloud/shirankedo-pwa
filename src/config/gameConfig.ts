/**
 * ゲーム全体の設定値。
 * バランス調整（初期所持金・運試しの料金・必要経験値など）は、基本的にこのファイルだけを変更すればよい。
 */

export const GAME_CONFIG = {
  /** 初期所持金（円） */
  initialMoney: 1000,
  /** 所持金の上限（JavaScript で誤差なく扱える範囲に収める） */
  maxMoney: 999_999_999_999,

  /** プレイヤー名の最大文字数 */
  playerNameMaxLength: 12,

  /** 運試し1回の料金（円） */
  luckGameCost: 100,
  /** 運試しの演出の長さ（ミリ秒）。演出は結果に影響しない */
  luckGameAnimationMs: 1600,

  /** 1日に発生できるランダムイベントの回数（0 は無制限） */
  randomEventDailyLimit: 10,

  /** 経験値の獲得量 */
  experience: {
    luckGame: 10,
    randomEvent: 20,
    firstDiscoveryBonus: 30,
  },
} as const;

/**
 * レベルアップに必要な経験値。
 * 例：LEVEL_UP_EXPERIENCE[0] は「レベル1 → 2」に必要な経験値。
 * 表より上のレベルは、最後の差分（増え幅）を使って自動で計算する（playerLevelSystem.ts）。
 */
export const LEVEL_UP_EXPERIENCE: readonly number[] = [100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250];

/** レベルの上限 */
export const MAX_LEVEL = 99;
