import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, FONT, MIN_TOUCH, SPACE, STICKER } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'plain' | 'danger';
  disabled?: boolean;
  icon?: string;
  /** ボタンの下に出す小さな説明 */
  note?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const BG = {
  primary: COLORS.primary,
  secondary: COLORS.accent,
  plain: COLORS.card,
  danger: COLORS.danger,
};

/** 大きめで押しやすいボタン。押すと少し沈む */
export function AppButton({ label, onPress, variant = 'primary', disabled, icon, note, style, testID }: Props) {
  const light = variant === 'primary' || variant === 'danger';
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, style, pressed && !disabled && styles.pressedWrap]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            { backgroundColor: disabled ? COLORS.disabled : BG[variant] },
            pressed && !disabled ? styles.pressed : styles.raised,
          ]}
        >
          <Text style={[styles.label, { color: light && !disabled ? '#fff' : COLORS.ink }]}>
            {icon ? `${icon}  ` : ''}
            {label}
          </Text>
          {note ? <Text style={[styles.note, { color: light && !disabled ? '#FFF1E8' : COLORS.subInk }]}>{note}</Text> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  pressedWrap: {},
  button: {
    ...STICKER,
    minHeight: MIN_TOUCH,
    paddingVertical: SPACE.m,
    paddingHorizontal: SPACE.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raised: { shadowColor: COLORS.ink, shadowOffset: { width: 3, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4, transform: [{ translateY: 0 }] },
  pressed: { transform: [{ translateY: 3 }], elevation: 0 },
  label: { fontSize: FONT.large, fontWeight: '800', textAlign: 'center' },
  note: { fontSize: FONT.small, marginTop: 2, textAlign: 'center' },
});
