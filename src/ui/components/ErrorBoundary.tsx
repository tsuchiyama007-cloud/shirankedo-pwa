import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { logger } from '../../core/logger';
import { COLORS, FONT, SPACE } from '../theme';
import { AppButton } from './AppButton';

/**
 * 予想外のエラーが起きたときの画面。
 * 技術的なエラー内容はプレイヤーに見せず、開発者向けログに残す。
 */
type Props = { children: ReactNode; onRetry: () => void };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error('UI', '画面でエラーが発生しました', error, info.componentStack);
  }

  retry = () => {
    this.setState({ hasError: false });
    this.props.onRetry();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.wrap}>
        <Text style={styles.icon}>🤷</Text>
        <Text style={styles.text}>予想外のことが起きました。</Text>
        <Text style={styles.sub}>知らんけど。</Text>
        <AppButton label="もう一度試す" onPress={this.retry} style={{ marginTop: SPACE.xl, width: '100%', maxWidth: 360 }} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACE.xxl },
  icon: { fontSize: 64, marginBottom: SPACE.l },
  text: { fontSize: FONT.large, fontWeight: '800', color: COLORS.ink },
  sub: { fontSize: FONT.body, color: COLORS.subInk, marginTop: SPACE.s },
});
