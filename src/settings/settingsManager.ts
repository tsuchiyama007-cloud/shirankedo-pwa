import type { PlayerData, Settings } from '../core/types';

export const SETTING_LABELS: Readonly<Record<keyof Settings, { label: string; note?: string }>> = {
  bgm: { label: 'BGM', note: '音源は準備中です（ON/OFFは保存されます）' },
  se: { label: '効果音（SE）', note: '音源は準備中です（ON/OFFは保存されます）' },
  vibration: { label: 'バイブレーション' },
  notification: { label: '通知', note: '通知機能は準備中です（ON/OFFは保存されます）' },
};

export function updateSetting(player: PlayerData, key: keyof Settings, value: boolean): PlayerData {
  return { ...player, settings: { ...player.settings, [key]: value } };
}
