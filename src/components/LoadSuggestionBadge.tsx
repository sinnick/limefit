import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, fontSize, spacing, borderRadius } from '../constants/theme';
import { LoadSuggestion } from '../types';

// ============================================================================
// LoadSuggestionBadge (CONTRACT-fase5A §3.2) — App UI.
//
// Muestra la sugerencia de carga calculada por `useLoadSuggestion`/`calcularSugerenciaCarga`.
// NO recalcula heurística: solo consume el LoadSuggestion que recibe por prop.
//
//   - {pesoSugerido} kg + flecha según `cambio`:
//       subir   → arrow-up    (lime)
//       bajar   → arrow-down   (naranja/warning)
//       mantener→ remove       (gris/textMuted)
//   - `razon` como texto secundario.
//   - basadoEn === 'sin_datos' ⇒ muestra "Sin datos" tenue (no oculta para no romper layout).
//   - `compact` para el inline de WorkoutScreen (badge en una sola fila, sin razón aparte).
// ============================================================================

interface LoadSuggestionBadgeProps {
  suggestion: LoadSuggestion;
  compact?: boolean;
}

export const LoadSuggestionBadge: React.FC<LoadSuggestionBadgeProps> = ({
  suggestion,
  compact = false,
}) => {
  const { colors } = useTheme();

  if (suggestion.basadoEn === 'sin_datos') {
    return (
      <View
        style={[
          styles.container,
          compact && styles.containerCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={[styles.sinDatos, { color: colors.textMuted }]}>Sin datos para sugerir</Text>
      </View>
    );
  }

  const { icono, color } = iconoYColor(suggestion.cambio, colors);

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { backgroundColor: colors.surface, borderColor: color },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="barbell-outline" size={16} color={colors.textSecondary} />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Sugerencia</Text>
        <Ionicons name={icono} size={16} color={color} />
        <Text style={[styles.peso, { color: colors.textPrimary }]}>
          {suggestion.pesoSugerido} kg
        </Text>
      </View>
      {!compact && (
        <Text style={[styles.razon, { color: colors.textMuted }]}>{suggestion.razon}</Text>
      )}
    </View>
  );
};

function iconoYColor(
  cambio: LoadSuggestion['cambio'],
  colors: ReturnType<typeof useTheme>['colors']
): { icono: keyof typeof Ionicons.glyphMap; color: string } {
  switch (cambio) {
    case 'subir':
      return { icono: 'arrow-up', color: colors.lime };
    case 'bajar':
      return { icono: 'arrow-down', color: colors.warning };
    case 'mantener':
    default:
      return { icono: 'remove', color: colors.textMuted };
  }
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  containerCompact: {
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  peso: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  razon: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
    textAlign: 'center',
  },
  sinDatos: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});

export default LoadSuggestionBadge;
