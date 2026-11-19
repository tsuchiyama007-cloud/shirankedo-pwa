import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT, MIN_TOUCH, SPACE } from '../theme';
import { useNavigation } from '../navigation';
import { Pressable } from 'react-native';

type Props = {
  title?: string;
  children: ReactNode;
  /** 戻るボタンを出すか（既定：戻れるなら出す） */
  showBack?: boolean;
  scroll?: boolean;
  footer?: ReactNode;
};

/** 画面の共通の枠（上部の見出し・戻るボタン・スクロール・横幅の上限） */
export function Screen({ title, children, showBack, scroll = true, footer }: Props) {
  const nav = useNavigation();
  const back = showBack ?? nav.canGoBack;
  const body = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.column}>
        {title ? (
          <View style={styles.header}>
            {back ? (
              <Pressable accessibilityRole="button" accessibilityLabel="もどる" onPress={nav.back} style={styles.backButton} hitSlop={8}>
                <Text style={styles.backText}>‹ もどる</Text>
              </Pressable>
            ) : (
              <View style={styles.backButton} />
            )}
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.backButton} />
          </View>
        ) : null}
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.scroll, { flex: 1 }]}>{body}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  column: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.m, minHeight: MIN_TOUCH },
  backButton: { width: 84, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: FONT.body, fontWeight: '700', color: COLORS.secondary },
  title: { flex: 1, textAlign: 'center', fontSize: FONT.large, fontWeight: '800', color: COLORS.ink },
  scroll: { flexGrow: 1, paddingHorizontal: SPACE.xl, paddingBottom: SPACE.xl, paddingTop: SPACE.s },
  inner: { gap: SPACE.l, flexGrow: 1 },
  footer: { paddingHorizontal: SPACE.xl, paddingBottom: SPACE.l, paddingTop: SPACE.s, gap: SPACE.s },
});
