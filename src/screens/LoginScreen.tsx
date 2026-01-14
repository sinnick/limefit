import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors, fontFamily } from '../constants/theme';
import { Button, Input } from '../components/ui';
import { useLogin } from '../services/queries';
import { useUserStore } from '../store/userStore';
import { useToast } from '../components/ui/Toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const [dni, setDni] = useState('');
  const [error, setError] = useState('');
  const { mutate: login, isPending } = useLogin();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  // Animations
  const logoScale = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    formOpacity.value = withDelay(300, withSpring(1));
    formTranslateY.value = withDelay(300, withSpring(0));
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleLogin = () => {
    setError('');

    if (!dni.trim()) {
      setError('Por favor ingresa tu DNI');
      return;
    }

    if (dni.length < 7) {
      setError('El DNI debe tener al menos 7 caracteres');
      return;
    }

    login(dni.trim(), {
      onError: (err: any) => {
        setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tu DNI.');
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo Section */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoWrapper}>
            <Text style={styles.logoIcon}>🍋</Text>
          </View>
          <Text style={styles.logoText}>LIMEFIT</Text>
          <Text style={styles.tagline}>Tu progreso, tu fuerza</Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          <View style={styles.formCard}>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.instructionText}>
              Ingresa tu DNI para acceder a tu cuenta
            </Text>

            <Input
              label="DNI"
              placeholder="Ingresa tu DNI"
              value={dni}
              onChangeText={(text) => {
                setDni(text);
                setError('');
              }}
              keyboardType="number-pad"
              error={error}
              autoCapitalize="none"
              maxLength={12}
              containerStyle={{ marginBottom: 24 }}
            />

            <Button
              title="Iniciar Sesión"
              variant="primary"
              size="lg"
              fullWidth
              loading={isPending}
              onPress={handleLogin}
            />

            <Text style={styles.footerText}>
              ¿No tienes cuenta?{' '}
              <Text style={styles.linkText}>Contacta al gym</Text>
            </Text>
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>LimeFit v2.0</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: colors.lime,
  },
  logoIcon: {
    fontSize: 48,
  },
  logoText: {
    fontFamily: fontFamily.bold,
    fontSize: 36,
    color: colors.lime,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: fontFamily.light,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  welcomeText: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  linkText: {
    color: colors.lime,
    fontFamily: fontFamily.semibold,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    fontFamily: fontFamily.light,
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default LoginScreen;
