import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useHaptics } from '../../hooks/useHaptics';
import { colors } from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.lime,
    },
    text: {
      color: colors.background,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
    },
    text: {
      color: colors.textPrimary,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.lime,
    },
    text: {
      color: colors.lime,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: colors.lime,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.error,
    },
    text: {
      color: colors.white,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    text: {
      fontSize: 14,
    },
  },
  md: {
    container: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
    },
    text: {
      fontSize: 16,
    },
  },
  lg: {
    container: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 16,
    },
    text: {
      fontSize: 18,
    },
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  onPress,
  ...props
}) => {
  const haptics = useHaptics();
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = (e: any) => {
    if (disabled || loading) return;
    haptics.light();
    onPress?.(e);
  };

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...sizeStyle.container,
    ...variantStyle.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
    ...(style as ViewStyle),
  };

  const textStyle: TextStyle = {
    fontFamily: 'Work-Sans-Bold',
    textAlign: 'center',
    ...sizeStyle.text,
    ...variantStyle.text,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.background : colors.lime}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{title}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
