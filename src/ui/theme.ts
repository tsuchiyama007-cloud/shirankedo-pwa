/** 色・余白・文字サイズ。見た目の調整はここで行う */
export const COLORS = {
  background: '#FFF6E5',
  card: '#FFFFFF',
  ink: '#2E2A26',
  subInk: '#6E655C',
  primary: '#FF7A3D',
  primaryDark: '#D9581E',
  secondary: '#3E7BFA',
  accent: '#FFD23F',
  success: '#2BA84A',
  danger: '#E5484D',
  disabled: '#D9D2C7',
  locked: '#B9AFA3',
  overlay: 'rgba(46, 42, 38, 0.55)',
} as const;

export const SPACE = { xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 } as const;

export const FONT = { small: 13, body: 16, large: 19, title: 24, huge: 34 } as const;

/** 指で押しやすいボタンの最小の高さ */
export const MIN_TOUCH = 52;

/** シールのような太枠＋ずらし影 */
export const STICKER = {
  borderWidth: 2,
  borderColor: COLORS.ink,
  borderRadius: 16,
} as const;
