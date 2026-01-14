import React, { useEffect } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, fontFamily } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showLabel = false,
  showPercentage = false,
  label,
  color = colors.lime,
  backgroundColor = colors.surface,
  animated = true,
  style,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(clampedProgress, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedProgress.value = clampedProgress;
    }
  }, [clampedProgress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  const containerStyle: ViewStyle = {
    width: '100%',
    ...style,
  };

  const labelContainerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  };

  const labelTextStyle: TextStyle = {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.textSecondary,
  };

  const percentageStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.lime,
  };

  const trackStyle: ViewStyle = {
    height,
    backgroundColor,
    borderRadius: height / 2,
    overflow: 'hidden',
  };

  const fillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: color,
    borderRadius: height / 2,
  };

  return (
    <View style={containerStyle}>
      {(showLabel || showPercentage) && (
        <View style={labelContainerStyle}>
          {showLabel && <Text style={labelTextStyle}>{label}</Text>}
          {showPercentage && (
            <Text style={percentageStyle}>{Math.round(clampedProgress)}%</Text>
          )}
        </View>
      )}
      <View style={trackStyle}>
        <Animated.View style={[fillStyle, animatedStyle]} />
      </View>
    </View>
  );
};

// Circular Progress component
interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = colors.lime,
  backgroundColor = colors.surface,
  showPercentage = true,
  children,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(strokeDashoffset, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [strokeDashoffset]);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const percentageStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: size / 4,
    color: colors.textPrimary,
  };

  // Note: For production, use react-native-svg for proper circular progress
  // This is a simplified version
  return (
    <View style={containerStyle}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: backgroundColor,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderRightColor: 'transparent',
          borderBottomColor: clampedProgress > 50 ? color : 'transparent',
          transform: [{ rotate: `${(clampedProgress / 100) * 360 - 90}deg` }],
        }}
      />
      {children || (showPercentage && (
        <Text style={percentageStyle}>{Math.round(clampedProgress)}%</Text>
      ))}
    </View>
  );
};

export default ProgressBar;
