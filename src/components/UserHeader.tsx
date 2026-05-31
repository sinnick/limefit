import React from 'react';
import { View, Text, TouchableOpacity, Image, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from '../constants/theme';
import { useUser } from '../store/userStore';

interface UserHeaderProps {
  onSettingsPress?: () => void;
  showSettings?: boolean;
  title?: string;
  subtitle?: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  onSettingsPress,
  showSettings = true,
  title,
  subtitle,
}) => {
  const user = useUser();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    // Respetar el área segura superior (status bar / Dynamic Island).
    paddingTop: insets.top + 16,
    paddingBottom: 16,
  };

  const leftContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  };

  const avatarStyle: ViewStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.lime,
  };

  const avatarImageStyle = {
    width: 48,
    height: 48,
    borderRadius: 24,
  };

  const textContainerStyle: ViewStyle = {
    flex: 1,
  };

  const greetingStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  };

  const nameStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    color: colors.textPrimary,
  };

  const titleStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 24,
    color: colors.textPrimary,
  };

  const subtitleStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  };

  const settingsButtonStyle: ViewStyle = {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getInitials = (): string => {
    if (!user?.NAME) return '?';
    const names = user.NAME.split(' ');
    return names.map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={containerStyle}>
      <View style={leftContainerStyle}>
        <View style={avatarStyle}>
          {user?.FOTO ? (
            <Image source={{ uri: user.FOTO }} style={avatarImageStyle} />
          ) : (
            <Text style={{ fontFamily: fontFamily.bold, fontSize: 16, color: colors.lime }}>
              {getInitials()}
            </Text>
          )}
        </View>
        <View style={textContainerStyle}>
          {title ? (
            <>
              <Text style={titleStyle}>{title}</Text>
              {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
            </>
          ) : (
            <>
              <Text style={greetingStyle}>{getGreeting()}</Text>
              <Text style={nameStyle} numberOfLines={1}>
                {user?.NAME || 'Usuario'}
              </Text>
            </>
          )}
        </View>
      </View>

      {showSettings && (
        <TouchableOpacity onPress={onSettingsPress} style={settingsButtonStyle}>
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default UserHeader;
