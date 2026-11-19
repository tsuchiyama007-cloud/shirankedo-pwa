import { GAME_CONFIG } from '../config/gameConfig';
import { formatYen } from '../core/format';
import type { MinigameDefinition } from './minigameBase';

/** 「遊ぶ」に並ぶミニゲームの一覧。追加はここに1件足す */
export const MINIGAMES: readonly MinigameDefinition[] = [
  {
    id: 'luck',
    title: '運試し',
    icon: '🎲',
    description: `${formatYen(GAME_CONFIG.luckGameCost)}で1回。何が出るかは知らんけど。`,
    screen: 'LuckGame',
  },
  {
    id: 'stroll',
    title: 'ぶらぶらする',
    icon: '🚶',
    description: '外を歩くと、何かが起きるかもしれない。',
    screen: 'RandomEvent',
  },
];
