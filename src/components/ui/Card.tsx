import React from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../../constants/theme';

interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  pressable?: boolean;
  style?: ViewStyle;
}

const paddingValues = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  pressable = false,
  style,
  onPress,
  ...props
}) => {
  const baseStyle: ViewStyle = {
    borderRadius: 16,
    padding: paddingValues[padding],
    overflow: 'hidden',
  };

  const variantStyles: Record<string, ViewStyle> = {
    default: {
      backgroundColor: colors.card,
    },
    elevated: {
      backgroundColor: colors.card,
      ...shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
    gradient: {
      backgroundColor: 'transparent',
    },
  };

  const containerStyle: ViewStyle = {
    ...baseStyle,
    ...variantStyles[variant],
    ...(style as ViewStyle),
  };

  if (variant === 'gradient') {
    const Content = pressable ? TouchableOpacity : View;
    return (
      <LinearGradient
        colors={[colors.surface, colors.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={containerStyle}
      >
        <Content
          onPress={pressable ? onPress : undefined}
          activeOpacity={0.7}
          style={{ flex: 1 }}
          {...(pressable ? props : {})}
        >
          {children}
        </Content>
      </LinearGradient>
    );
  }

  if (pressable) {
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
};

// Card Header component
interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View
    style={{
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 12,
      ...style,
    }}
  >
    {children}
  </View>
);

// Card Content component
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={{ ...style }}>{children}</View>
);

// Card Footer component
interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => (
  <View
    style={{
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 12,
      ...style,
    }}
  >
    {children}
  </View>
);

export default Card;
