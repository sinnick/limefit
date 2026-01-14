import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'fitness-outline',
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    ...style,
  };

  const iconContainerStyle: ViewStyle = {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  };

  const titleStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  };

  const descriptionStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  };

  return (
    <View style={containerStyle}>
      <View style={iconContainerStyle}>
        <Ionicons name={icon} size={48} color={colors.lime} />
      </View>
      <Text style={titleStyle}>{title}</Text>
      {description && <Text style={descriptionStyle}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          variant="primary"
          onPress={onAction}
        />
      )}
    </View>
  );
};

export default EmptyState;
