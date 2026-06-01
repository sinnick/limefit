import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useSyncStatus } from '../hooks/useSyncStatus';
import { useSyncStore } from '../services/syncQueue';
import { fontFamily } from '../constants/theme';

// ============================================================================
// SyncStatusBadge (CONTRACT-fase5A §3.1).
//
// Indicador de estado de la cola de sync. Consume `useSyncStatus()` (NO recalcula
// counts ni heurística) y renderiza según `estado`:
//   - al_dia        → check verde "Al día"
//   - pendiente     → naranja "{pendientes} sin sincronizar"
//   - sincronizando → spinner + "Sincronizando…"
//   - error         → rojo "Error de sync — reintentando"
// Tap dispara un flush manual (reintento). Sin libs nativas nuevas.
// ============================================================================

export const SyncStatusBadge: React.FC = () => {
  const { colors } = useTheme();
  const { estado, pendientes, ultimoError } = useSyncStatus();

  const handlePress = () => {
    void useSyncStore.getState().flush();
  };

  let icon: keyof typeof Ionicons.glyphMap = 'checkmark-circle';
  let tint = colors.success;
  let label = 'Al día';
  let spinner = false;

  switch (estado) {
    case 'sincronizando':
      spinner = true;
      tint = colors.lime;
      label = 'Sincronizando…';
      break;
    case 'pendiente':
      icon = 'cloud-upload-outline';
      tint = colors.warning;
      label = `${pendientes} sin sincronizar`;
      break;
    case 'error':
      icon = 'warning-outline';
      tint = colors.error;
      label = 'Error de sync — reintentando';
      break;
    case 'al_dia':
    default:
      icon = 'checkmark-circle';
      tint = colors.success;
      label = 'Al día';
      break;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={ultimoError ? `${label}. ${ultimoError}` : label}
      style={[
        styles.container,
        { backgroundColor: `${tint}1A`, borderColor: `${tint}33` },
      ]}
    >
      {spinner ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Ionicons name={icon} size={14} color={tint} />
      )}
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    maxWidth: 220,
  },
});

export default SyncStatusBadge;
