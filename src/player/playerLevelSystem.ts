import { LEVEL_UP_EXPERIENCE, MAX_LEVEL } from '../config/gameConfig';
import type { PlayerData } from '../core/types';

/** 指定レベルから次のレベルに上がるのに必要な経験値 */
export function requiredExperience(level: number): number {
  const table = LEVEL_UP_EXPERIENCE;
  if (level < 1) return table[0];
  if (level <= table.length) return table[level - 1];
  // 表より上：最後の増え幅のまま伸ばす
  const lastStep = table[table.length - 1] - table[table.length - 2];
  return table[table.length - 1] + lastStep * (level - table.length);
}

export type ExperienceResult = {
  player: PlayerData;
  levelsGained: number;
};

/** 経験値を加え、必要量を超えたらレベルアップする（余りは次のレベルに繰り越し） */
export function addExperience(player: PlayerData, amount: number): ExperienceResult {
  if (!Number.isFinite(amount) || amount <= 0) return { player, levelsGained: 0 };

  let level = player.level;
  let experience = player.experience + Math.floor(amount);
  let levelsGained = 0;
  while (level < MAX_LEVEL && experience >= requiredExperience(level)) {
    experience -= requiredExperience(level);
    level += 1;
    levelsGained += 1;
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    experience = Math.min(experience, requiredExperience(MAX_LEVEL));
  }
  return { player: { ...player, level, experience }, levelsGained };
}
