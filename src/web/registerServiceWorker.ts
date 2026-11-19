/**
 * PWA 用：オフラインでも起動できるよう Service Worker を登録する（ブラウザ版のみ）。
 * Service Worker の本体は public/sw.js。スマホアプリ版では何もしない。
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  if (typeof __DEV__ !== 'undefined' && __DEV__) return; // 開発中は古いキャッシュで混乱しないよう登録しない

  window.addEventListener('load', () => {
    // index.html と同じ場所（GitHub Pages のサブパスにも対応）にある sw.js を登録
    const base = new URL('.', window.location.href);
    navigator.serviceWorker.register(new URL('sw.js', base).toString(), { scope: base.pathname }).catch(() => {
      // 登録できなくてもゲームは動く
    });
  });
}
