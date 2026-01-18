import React, { useEffect, createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, ViewStyle, TextStyle, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, shadows } from '../../constants/theme';
import { useHaptics } from '../../hooks/useHaptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'pr';

interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
  title?: string;
}

interface ToastContextType {
  show: (config: ToastConfig) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  pr: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const toastConfig: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: colors.success },
  error: { icon: 'close-circle', color: colors.error },
  warning: { icon: 'warning', color: colors.warning },
  info: { icon: 'information-circle', color: colors.info },
  pr: { icon: 'trophy', color: colors.lime },
};

interface ToastProps {
  config: ToastConfig | null;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({ config, onHide }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (config) {
      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        // Animate out
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, config.duration || 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset values when config is null
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [config, onHide, translateY, opacity]);

  if (!config) return null;

  const { icon, color } = toastConfig[config.type];

  const containerStyle: ViewStyle = {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: color,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    ...shadows.lg,
  };

  const iconContainerStyle: ViewStyle = {
    marginRight: 12,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
  };

  const titleStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: config.title ? 4 : 0,
  };

  const messageStyle: TextStyle = {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ translateY }], opacity }]}>
      <View style={iconContainerStyle}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <View style={contentStyle}>
        {config.title && <Text style={titleStyle}>{config.title}</Text>}
        <Text style={[messageStyle, !config.title && { color: colors.textPrimary }]}>
          {config.message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<ToastConfig | null>(null);
  const haptics = useHaptics();

  const show = useCallback((config: ToastConfig) => {
    setCurrentToast(config);

    // Haptic feedback basado en tipo
    switch (config.type) {
      case 'success':
      case 'pr':
        haptics.success();
        break;
      case 'error':
        haptics.error();
        break;
      case 'warning':
        haptics.warning();
        break;
      default:
        haptics.light();
    }
  }, [haptics]);

  const success = useCallback((message: string, title?: string) => {
    show({ type: 'success', message, title, duration: 3000 });
  }, [show]);

  const error = useCallback((message: string, title?: string) => {
    show({ type: 'error', message, title, duration: 4000 });
  }, [show]);

  const warning = useCallback((message: string, title?: string) => {
    show({ type: 'warning', message, title, duration: 3500 });
  }, [show]);

  const info = useCallback((message: string, title?: string) => {
    show({ type: 'info', message, title, duration: 3000 });
  }, [show]);

  const pr = useCallback((message: string, title?: string) => {
    show({ type: 'pr', message, title: title || '¡NUEVO PR!', duration: 5000 });
  }, [show]);

  const handleHide = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, pr }}>
      {children}
      <Toast config={currentToast} onHide={handleHide} />
    </ToastContext.Provider>
  );
};

// Hook para usar toast
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default Toast;
