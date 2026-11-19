/**
 * 乱数。
 * 抽選はすべてこのファイルの関数を通す。テストでは「決まった値を返す乱数」に差し替えられる。
 */

/** 0 以上 1 未満の数を返す関数 */
export type RandomSource = () => number;

export const defaultRandom: RandomSource = () => Math.random();

/**
 * 重み付き抽選。weight が大きい要素ほど選ばれやすい。
 * 候補が空、または重みの合計が 0 以下のときは null を返す。
 */
export function pickWeighted<T>(
  entries: readonly T[],
  getWeight: (entry: T) => number,
  random: RandomSource = defaultRandom,
): T | null {
  const weights = entries.map((e) => Math.max(0, getWeight(e)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (entries.length === 0 || total <= 0) return null;

  let threshold = random() * total;
  for (let i = 0; i < entries.length; i++) {
    threshold -= weights[i];
    if (threshold < 0) return entries[i];
  }
  // 浮動小数の誤差で最後まで来た場合は、重みが 0 でない最後の要素
  for (let i = entries.length - 1; i >= 0; i--) {
    if (weights[i] > 0) return entries[i];
  }
  return null;
}
