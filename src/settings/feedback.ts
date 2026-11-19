import { Platform, Vibration } from 'react-native';
import type { Settings } from '../core/types';

/**
 * 振動・効果音。設定が OFF のときは何もしない。
 * 効果音・BGM は、ライセンスを確認した音源を用意したらここに追加する（今は音を鳴らさない）。
 */

export type FeedbackKind = 'tap' | 'win' | 'bigWin';

const PATTERNS: Record<FeedbackKind, number | number[]> = {
  tap: 15,
  win: 60,
  bigWin: [0, 80, 60, 80, 60, 160],
};

export function vibrate(settings: Settings, kind: FeedbackKind): void {
  if (!settings.vibration) return;
  try {
    if (Platform.OS === 'web') {
      // ブラウザ（主に Android の Chrome）。対応していない端末では何もしない
      const nav = globalThis.navigator as Navigator | undefined;
      nav?.vibrate?.(PATTERNS[kind]);
      return;
    }
    Vibration.vibrate(PATTERNS[kind]);
  } catch {
    // 振動できなくてもゲームは続ける
  }
}
