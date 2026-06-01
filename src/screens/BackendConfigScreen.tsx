import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { colors, fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { Button, Input } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import {
  getBackendUrl,
  getDefaultBackendUrl,
  setBackendUrl,
  resetBackendUrl,
  isValidBackendUrl,
} from '../services/backendConfig';

// ============================================================================
// BackendConfigScreen — configura la URL del backend (engranaje del login).
//
// El usuario edita la URL del servidor del gym (sin /api); la capa de red agrega
// /api para las llamadas. Persiste en MMKV vía services/backendConfig. Patrón
// inspirado en tuta-passenger-app (Settings del AuthStack).
// ============================================================================

// Misma lógica que getApiBaseUrl pero sobre el texto en edición (preview en vivo).
const toApiPreview = (url: string): string => {
  const base = url.trim().replace(/\/+$/, '');
  if (!base) return '';
  return base.endsWith('/api') ? base : `${base}/api`;
};

type TestState =
  | { status: 'idle' }
  | { status: 'testing' }
  | { status: 'ok'; code: number }
  | { status: 'fail'; message: string };

export const BackendConfigScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [url, setUrl] = useState(getBackendUrl());
  const [test, setTest] = useState<TestState>({ status: 'idle' });

  const defaultUrl = getDefaultBackendUrl();
  const valid = isValidBackendUrl(url);
  const isDefault = url.trim().replace(/\/+$/, '') === defaultUrl;

  const handleSave = () => {
    if (!valid) {
      toast.error('Ingresá una URL válida (http:// o https://)');
      return;
    }
    const saved = setBackendUrl(url);
    toast.success(`Backend guardado: ${saved}`);
    navigation.goBack();
  };

  const handleReset = () => {
    resetBackendUrl();
    setUrl(getDefaultBackendUrl());
    setTest({ status: 'idle' });
    toast.info('Backend restablecido al predeterminado');
  };

  const handleUseDefault = () => {
    setUrl(defaultUrl);
    setTest({ status: 'idle' });
  };

  const handleTest = async () => {
    if (!valid) {
      toast.error('Ingresá una URL válida antes de probar');
      return;
    }
    setTest({ status: 'testing' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      // /hello es el endpoint liviano del backend Next; sirve de health-check.
      const res = await fetch(`${toApiPreview(url)}/hello`, {
        method: 'GET',
        signal: controller.signal,
      });
      setTest({ status: 'ok', code: res.status });
    } catch (e: any) {
      const message =
        e?.name === 'AbortError' ? 'Tiempo de espera agotado' : 'No se pudo conectar';
      setTest({ status: 'fail', message });
    } finally {
      clearTimeout(timeout);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Configuración del backend</Text>
          <Text style={styles.headerSubtitle}>Servidor al que se conecta la app</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="URL del servidor"
          placeholder="https://sinnick.dev/level"
          value={url}
          onChangeText={(t) => {
            setUrl(t);
            setTest({ status: 'idle' });
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          containerStyle={{ marginBottom: spacing.md }}
        />

        {/* Preview de la URL efectiva */}
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>Las llamadas irán a</Text>
          <Text style={styles.previewUrl}>
            {toApiPreview(url) || '—'}
          </Text>
        </View>

        {/* Atajo al predeterminado */}
        {!isDefault && (
          <TouchableOpacity style={styles.presetRow} onPress={handleUseDefault} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={16} color={colors.lime} />
            <Text style={styles.presetText}>Usar predeterminado ({defaultUrl})</Text>
          </TouchableOpacity>
        )}

        {/* Resultado de la prueba de conexión */}
        {test.status !== 'idle' && (
          <View
            style={[
              styles.testResult,
              test.status === 'ok' && styles.testOk,
              test.status === 'fail' && styles.testFail,
            ]}
          >
            {test.status === 'testing' && <ActivityIndicator size="small" color={colors.lime} />}
            {test.status === 'ok' && (
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            )}
            {test.status === 'fail' && (
              <Ionicons name="close-circle" size={18} color={colors.error} />
            )}
            <Text style={styles.testText}>
              {test.status === 'testing' && 'Probando conexión…'}
              {test.status === 'ok' && `Conexión OK (HTTP ${test.code})`}
              {test.status === 'fail' && test.message}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="Probar conexión"
            variant="outline"
            size="lg"
            fullWidth
            loading={test.status === 'testing'}
            onPress={handleTest}
          />
          <Button
            title="Guardar"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleSave}
            leftIcon={<Ionicons name="save-outline" size={20} color={colors.background} />}
          />
          <Button title="Restablecer" variant="ghost" size="md" fullWidth onPress={handleReset} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  previewUrl: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    color: colors.lime,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.lime,
    flexShrink: 1,
  },
  testResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  testOk: {
    backgroundColor: colors.success + '1A',
  },
  testFail: {
    backgroundColor: colors.error + '1A',
  },
  testText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});

export default BackendConfigScreen;
