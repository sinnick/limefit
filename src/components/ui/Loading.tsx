import React from 'react';
import { View, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, fontFamily } from '../../constants/theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  fullScreen = false,
  size = 'large',
  color = colors.lime,
}) => {
  const containerStyle: ViewStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    ...(fullScreen && {
      flex: 1,
      backgroundColor: colors.background,
    }),
  };

  const messageStyle: TextStyle = {
    fontFamily: fontFamily.medium,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  };

  return (
    <View style={containerStyle}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={messageStyle}>{message}</Text>}
    </View>
  );
};

// Skeleton Loading Component
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const skeletonStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...style,
  };

  return <View style={skeletonStyle} />;
};

// Card Skeleton
export const CardSkeleton: React.FC = () => {
  const containerStyle: ViewStyle = {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  };

  return (
    <View style={containerStyle}>
      <Skeleton width="70%" height={24} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={16} />
    </View>
  );
};

// List Skeleton
interface ListSkeletonProps {
  count?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ count = 3 }) => {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
};

export default Loading;
