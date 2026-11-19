/**
 * 開発者向けログ。
 * 「[SaveManager] 保存しました」のように、発生元が分かる形で出力する。
 * リリース版（__DEV__ が false）では info / debug を出さず、warn / error だけを残す。
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;

export type LogTag =
  | 'GameManager'
  | 'SaveManager'
  | 'EventManager'
  | 'ItemManager'
  | 'CurrencyManager'
  | 'LuckGame'
  | 'AdManager'
  | 'UI';

export const logger = {
  debug(tag: LogTag, ...args: unknown[]) {
    if (isDev) console.log(`[${tag}]`, ...args);
  },
  info(tag: LogTag, ...args: unknown[]) {
    if (isDev) console.log(`[${tag}]`, ...args);
  },
  warn(tag: LogTag, ...args: unknown[]) {
    console.warn(`[${tag}]`, ...args);
  },
  error(tag: LogTag, ...args: unknown[]) {
    console.error(`[${tag}]`, ...args);
  },
};
