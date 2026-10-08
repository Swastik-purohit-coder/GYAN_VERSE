import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, radii, spacing } from '../../theme';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let bg = colors.primary.subtle;
    let border = colors.primary.main;

    if (variant === 'success') {
      bg = colors.success.subtle;
      border = colors.success.main;
    } else if (variant === 'warning') {
      bg = colors.warning.subtle;
      border = colors.warning.main;
    } else if (variant === 'error') {
      bg = colors.error.subtle;
      border = colors.error.main;
    } else if (variant === 'neutral') {
      bg = colors.background.tertiary;
      border = colors.surface.border;
    }

    return {
      backgroundColor: bg,
      borderColor: border,
      paddingVertical: size === 'sm' ? 2 : spacing.xs,
      paddingHorizontal: size === 'sm' ? spacing.xs + 2 : spacing.sm + 2,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = colors.primary.light;

    if (variant === 'success') {
      color = colors.success.light;
    } else if (variant === 'warning') {
      color = colors.warning.light;
    } else if (variant === 'error') {
      color = colors.error.light;
    } else if (variant === 'neutral') {
      color = colors.text.secondary;
    }

    return {
      color,
      fontSize: size === 'sm' ? 10 : 12,
    };
  };

  return (
    <View style={[styles.container, getContainerStyle(), style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, getTextStyle()]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    ...typography.caption,
    fontWeight: '600',
  },
});
