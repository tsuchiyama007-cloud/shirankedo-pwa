import { logger } from '../core/logger';

/**
 * 広告。ゲーム側は AdManager.showRewardedAd() を呼ぶだけにして、広告サービスの違いをここに閉じ込める。
 *
 * いまは実際の広告SDKを入れていない。
 * - 開発中（__DEV__）：数秒待って「視聴完了」とみなす仮の広告（動作確認用）
 * - リリース版：広告なし（isAvailable() が false になり、ボタンは表示されない）
 * AdMob などを入れるときは、RewardedAdProvider を実装して setProvider() で差し替える。
 */

export type RewardedAdResult = { rewarded: true } | { rewarded: false; reason: 'unavailable' | 'failed' | 'closed' };

export type RewardedAdProvider = {
  name: string;
  isAvailable(): boolean;
  show(): Promise<RewardedAdResult>;
};

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

const devSimulatedProvider: RewardedAdProvider = {
  name: 'dev-simulated',
  isAvailable: () => true,
  show: () => new Promise((resolve) => setTimeout(() => resolve({ rewarded: true }), 1500)),
};

const noAdProvider: RewardedAdProvider = {
  name: 'none',
  isAvailable: () => false,
  show: async () => ({ rewarded: false, reason: 'unavailable' }),
};

let provider: RewardedAdProvider = isDev ? devSimulatedProvider : noAdProvider;
let showing = false;

export const AdManager = {
  setProvider(next: RewardedAdProvider) {
    provider = next;
  },
  isAvailable(): boolean {
    return provider.isAvailable();
  },
  /** リワード広告を表示する。失敗してもゲームの状態は変えない（例外も投げない） */
  async showRewardedAd(): Promise<RewardedAdResult> {
    if (showing) return { rewarded: false, reason: 'failed' };
    showing = true;
    try {
      const result = await provider.show();
      logger.info('AdManager', `リワード広告（${provider.name}）:`, result);
      return result;
    } catch (error) {
      logger.warn('AdManager', '広告の表示に失敗しました', error);
      return { rewarded: false, reason: 'failed' };
    } finally {
      showing = false;
    }
  },
};

export const AD_FAILED_MESSAGE = '現在広告を再生できません。\n\nしばらくしてからもう一度試してください。';
