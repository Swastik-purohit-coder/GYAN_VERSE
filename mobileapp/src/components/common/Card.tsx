import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radii, spacing, shadows } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  variant?: 'default' | 'flat' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  variant = 'default',
}) => {
  const cardStyles = [
    styles.base,
    elevated ? shadows.md : {},
    variant === 'highlight' && styles.highlight,
    variant === 'flat' && styles.flat,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyles,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  flat: {
    backgroundColor: colors.background.secondary,
    borderWidth: 0,
  },
  highlight: {
    borderColor: colors.primary.main,
    backgroundColor: colors.surface.card,
  },
});
