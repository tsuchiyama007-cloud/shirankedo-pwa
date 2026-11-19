import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, SPACE, STICKER } from '../theme';
import { AppButton } from './AppButton';

/**
 * ポップアップ（確認・お知らせ）。
 * showPopup で表示し、押されたボタンの値を Promise で受け取れる。
 * 複数呼ばれた場合は順番に表示する。
 */

export type PopupButton<T extends string = string> = {
  label: string;
  value: T;
  variant?: 'primary' | 'secondary' | 'plain' | 'danger';
};

export type PopupOptions<T extends string = string> = {
  title?: string;
  message: string;
  icon?: string;
  buttons?: PopupButton<T>[];
};

type QueueItem = PopupOptions & { resolve: (value: string) => void };

type PopupApi = {
  showPopup<T extends string = 'ok'>(options: PopupOptions<T>): Promise<T>;
  confirm(message: string, okLabel?: string, title?: string): Promise<boolean>;
};

const PopupContext = createContext<PopupApi | null>(null);

export function PopupProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const closing = useRef(false);

  const showPopup = useCallback(<T extends string = 'ok'>(options: PopupOptions<T>) => {
    return new Promise<T>((resolve) => {
      setQueue((q) => [...q, { ...(options as PopupOptions), resolve: resolve as (v: string) => void }]);
    });
  }, []);

  const api = useMemo<PopupApi>(
    () => ({
      showPopup,
      async confirm(message, okLabel = 'はい', title) {
        const result = await showPopup<'ok' | 'cancel'>({
          title,
          message,
          buttons: [
            { label: okLabel, value: 'ok', variant: 'primary' },
            { label: 'やめておく', value: 'cancel', variant: 'plain' },
          ],
        });
        return result === 'ok';
      },
    }),
    [showPopup],
  );

  const current = queue[0];
  const close = (value: string) => {
    // 連打で2回閉じないようにする
    if (closing.current || !current) return;
    closing.current = true;
    current.resolve(value);
    setQueue((q) => q.slice(1));
    setTimeout(() => {
      closing.current = false;
    }, 250);
  };
  const buttons = current?.buttons ?? [{ label: 'OK', value: 'ok', variant: 'primary' as const }];

  return (
    <PopupContext.Provider value={api}>
      {children}
      <Modal visible={!!current} transparent animationType="fade" onRequestClose={() => close(buttons[buttons.length - 1].value)}>
        <View style={styles.overlay}>
          <View style={styles.box} accessibilityRole="alert">
            {current?.icon ? <Text style={styles.icon}>{current.icon}</Text> : null}
            {current?.title ? <Text style={styles.title}>{current.title}</Text> : null}
            <Text style={styles.message}>{current?.message}</Text>
            <View style={styles.buttons}>
              {buttons.map((b) => (
                <AppButton key={b.value} label={b.label} variant={b.variant ?? 'primary'} onPress={() => close(b.value)} />
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </PopupContext.Provider>
  );
}

export function usePopup(): PopupApi {
  const api = useContext(PopupContext);
  if (!api) throw new Error('PopupProvider の外で usePopup が呼ばれました');
  return api;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', padding: SPACE.xl },
  box: {
    ...STICKER,
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.card,
    padding: SPACE.xl,
    gap: SPACE.m,
  },
  icon: { fontSize: 44, textAlign: 'center' },
  title: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  message: { fontSize: FONT.body, lineHeight: 25, color: COLORS.ink, textAlign: 'center' },
  buttons: { gap: SPACE.s, marginTop: SPACE.s },
});
