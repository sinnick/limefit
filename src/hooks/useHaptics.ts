import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../store/userStore';

export const useHaptics = () => {
  const settings = useSettings();

  const light = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [settings.vibracionActiva]);

  const medium = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [settings.vibracionActiva]);

  const heavy = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, [settings.vibracionActiva]);

  const success = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [settings.vibracionActiva]);

  const warning = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [settings.vibracionActiva]);

  const error = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [settings.vibracionActiva]);

  const selection = useCallback(() => {
    if (settings.vibracionActiva) {
      Haptics.selectionAsync();
    }
  }, [settings.vibracionActiva]);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
};
