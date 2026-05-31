import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors, fontFamily } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { activeBrand } from '../../brands/registry';
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
  const logoScale = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      damping: 10,
      stiffness: 100,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 400,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.spring(formTranslateY, {
        toValue: 0,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, formOpacity, formTranslateY]);

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
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          {activeBrand.logoImage ? (
            // Marca con wordmark propio: el logo reemplaza al badge + nombre de texto.
            <Image source={activeBrand.logoImage} style={styles.logoBanner} resizeMode="contain" />
          ) : (
            <>
              <View style={styles.logoWrapper}>
                <Text style={styles.logoIcon}>{activeBrand.logoEmoji}</Text>
              </View>
              <Text style={styles.logoText}>{APP_CONFIG.name.toUpperCase()}</Text>
            </>
          )}
          <Text style={styles.tagline}>{activeBrand.tagline}</Text>
        </Animated.View>

        {/* Form Section */}
        <Animated.View style={[styles.formContainer, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
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
          <Text style={styles.versionText}>{APP_CONFIG.name} v{APP_CONFIG.version}</Text>
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
  logoBanner: {
    width: 260,
    height: 114,
    marginBottom: 8,
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
