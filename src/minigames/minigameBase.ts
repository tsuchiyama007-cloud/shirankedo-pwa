/**
 * ミニゲームの共通の形。
 * 新しいミニゲーム（クイズ・タイミングなど）を追加するときは、この形で minigameRegistry.ts に登録する。
 * 既存のミニゲームには手を入れずに追加できる。
 */
export type MinigameDefinition = {
  id: string;
  title: string;
  icon: string;
  description: string;
  /** 画面の名前（ui/navigation.ts の ScreenName） */
  screen: 'LuckGame' | 'RandomEvent';
};
