import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../constants/theme';

interface TagBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
  onPress?: () => void;
  selected?: boolean;
}

export default function TagBadge({ name, color, size = 'sm', onPress, selected }: TagBadgeProps) {
  const isSmall = size === 'sm';
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.badge,
        {
          backgroundColor: selected ? color + '20' : color + '12',
          borderColor: selected ? color : 'transparent',
          borderWidth: selected ? 1.5 : 0,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 6,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        style={[
          styles.text,
          {
            color: color,
            fontSize: isSmall ? 11 : 13,
            fontWeight: selected ? '600' : '500',
          },
        ]}
      >
        {name}
      </Text>
    </Container>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.full,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  text: {
    letterSpacing: 0.2,
  },
});
