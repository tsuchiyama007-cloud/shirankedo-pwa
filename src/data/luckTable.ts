import type { LuckTableEntry } from '../core/types';

/**
 * 運試しの抽選表。
 * weight（重み）は「10万回引いたら何回出るか」の目安。確率 = weight ÷ 合計。
 * 確率を変えるときは weight だけを変更する（合計が 100,000 でなくても動く）。
 */
export const LUCK_TABLE: readonly LuckTableEntry[] = [
  { id: 'nothing', label: '何も起きない', weight: 35000, prize: { kind: 'nothing' } },
  { id: 'money_10', label: '10円', weight: 20000, prize: { kind: 'money', amount: 10 } },
  { id: 'money_50', label: '50円', weight: 15000, prize: { kind: 'money', amount: 50 } },
  { id: 'money_100', label: '100円', weight: 12000, prize: { kind: 'money', amount: 100 } },
  { id: 'money_500', label: '500円', weight: 3000, prize: { kind: 'money', amount: 500 } },
  { id: 'money_1000', label: '1,000円', weight: 1500, prize: { kind: 'money', amount: 1000 } },
  { id: 'money_10000', label: '10,000円', weight: 200, prize: { kind: 'money', amount: 10000 } },
  { id: 'money_100000', label: '100,000円', weight: 20, prize: { kind: 'money', amount: 100000 } },
  { id: 'money_1000000', label: '1,000,000円', weight: 2, prize: { kind: 'money', amount: 1000000 } },
  { id: 'item', label: 'アイテム', weight: 11000, prize: { kind: 'item' } },
  { id: 'special_event', label: '特殊イベント', weight: 2278, prize: { kind: 'specialEvent' } },
];
