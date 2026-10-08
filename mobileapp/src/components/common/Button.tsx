import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { colors, typography, radii, spacing, shadows } from '../../theme';

export interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  ...props
}) => {
  const getContainerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.md,
      opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
    };

    // Size variants
    if (size === 'sm') {
      base.paddingVertical = spacing.xs + 2;
      base.paddingHorizontal = spacing.md;
    } else if (size === 'lg') {
      base.paddingVertical = spacing.lg;
      base.paddingHorizontal = spacing.xxl;
    } else {
      base.paddingVertical = spacing.md;
      base.paddingHorizontal = spacing.xl;
    }

    // Color variants
    if (variant === 'primary') {
      return [base, styles.primary, shadows.sm, style || {}];
    }
    if (variant === 'secondary') {
      return [base, styles.secondary, style || {}];
    }
    if (variant === 'outline') {
      return [base, styles.outline, style || {}];
    }
    if (variant === 'danger') {
      return [base, styles.danger, shadows.sm, style || {}];
    }
    return [base, styles.ghost, style || {}];
  };

  const getTextStyle = (): TextStyle[] => {
    let colorStyle: TextStyle = { color: colors.text.primary };
    if (variant === 'primary' || variant === 'danger') {
      colorStyle = { color: '#FFFFFF' };
    } else if (variant === 'outline') {
      colorStyle = { color: colors.primary.light };
    } else if (variant === 'ghost') {
      colorStyle = { color: colors.text.secondary };
    }

    const sizeStyle: TextStyle =
      size === 'sm' ? typography.bodySmall : size === 'lg' ? typography.h4 : typography.button;

    return [sizeStyle, colorStyle, styles.textBase, textStyle || {}];
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={getContainerStyle}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary.main : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          <Text style={getTextStyle()}>{title}</Text>
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  textBase: {
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  primary: {
    backgroundColor: colors.primary.main,
  },
  secondary: {
    backgroundColor: colors.background.tertiary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary.main,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.error.main,
  },
});
