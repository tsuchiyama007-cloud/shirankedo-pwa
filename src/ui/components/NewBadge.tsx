import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme';

/** 初めて見つけたときに出る「NEW!」 */
export function NewBadge() {
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: false }).start();
  }, [scale]);
  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }, { rotate: '-8deg' }] }]}>
      <Text style={styles.text}>NEW!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: { backgroundColor: COLORS.danger, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 2, borderColor: COLORS.ink },
  text: { color: '#fff', fontWeight: '900', fontSize: 13 },
});
