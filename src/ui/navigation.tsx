import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BackHandler } from 'react-native';

/**
 * 画面の切り替え。
 * 画面は「積み重ね（スタック）」で管理し、戻ると1つ前の画面に戻る。
 * 画面遷移の連打で同じ画面が2回開かないよう、短い間は次の遷移を受け付けない。
 */

export type ScreenName =
  | 'Title'
  | 'PlayerCreate'
  | 'Home'
  | 'Play'
  | 'LuckGame'
  | 'LuckOdds'
  | 'RandomEvent'
  | 'Inventory'
  | 'Collection'
  | 'Settings';

export type ScreenParams = {
  /** RandomEvent：運試しの特殊イベントで発生させるイベントID */
  specialEventId?: string;
};

export type Route = { name: ScreenName; params?: ScreenParams; key: number };

type NavigationApi = {
  current: Route;
  canGoBack: boolean;
  navigate(name: ScreenName, params?: ScreenParams): void;
  replace(name: ScreenName, params?: ScreenParams): void;
  reset(name: ScreenName): void;
  back(): void;
  /** true の間は「戻る」を無効にする（イベントの選択中など） */
  setBackBlocked(blocked: boolean): void;
};

const NavigationContext = createContext<NavigationApi | null>(null);

/** 画面遷移の連打を無視する時間（ミリ秒） */
const TRANSITION_GUARD_MS = 350;

export function NavigationProvider({ initial, children }: { initial: ScreenName; children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: initial, key: 0 }]);
  const nextKey = useRef(1);
  const lastTransition = useRef(0);
  const backBlocked = useRef(false);

  const guard = useCallback(() => {
    const now = Date.now();
    if (now - lastTransition.current < TRANSITION_GUARD_MS) return false;
    lastTransition.current = now;
    return true;
  }, []);

  const api = useMemo<NavigationApi>(
    () => ({
      current: stack[stack.length - 1],
      canGoBack: stack.length > 1,
      navigate(name, params) {
        if (!guard()) return;
        setStack((s) => [...s, { name, params, key: nextKey.current++ }]);
      },
      replace(name, params) {
        if (!guard()) return;
        setStack((s) => [...s.slice(0, -1), { name, params, key: nextKey.current++ }]);
      },
      reset(name) {
        lastTransition.current = Date.now();
        backBlocked.current = false;
        setStack([{ name, key: nextKey.current++ }]);
      },
      back() {
        if (backBlocked.current || !guard()) return;
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      },
      setBackBlocked(blocked) {
        backBlocked.current = blocked;
      },
    }),
    [stack, guard],
  );

  // Android の「戻る」ボタン：1つ前の画面に戻る。最初の画面ではアプリの標準動作に任せる
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backBlocked.current) return true;
      if (stack.length > 1) {
        api.back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [api, stack.length]);

  return <NavigationContext.Provider value={api}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationApi {
  const nav = useContext(NavigationContext);
  if (!nav) throw new Error('NavigationProvider の外で useNavigation が呼ばれました');
  return nav;
}
