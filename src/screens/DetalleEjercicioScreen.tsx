import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useDetalleEjercicioQuery } from '../services/queries';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { Card, EmptyState } from '../components/ui';

// ============================================================================
// DetalleEjercicioScreen (CONTRACT-fase2 §4 / §5.4 — Feature 2.1).
//
// Detalle de un ejercicio de la biblioteca: nombre, grupo muscular, equipo,
// dificultad, instrucciones y media. Lee por React Query
// (useDetalleEjercicioQuery → ejerciciosApi.getById, fallback de red). No es
// offline-first ni escribe al store: solo lectura del catálogo del gym.
//
// URL_IMAGEN viene "" del seed por ahora; si no hay imagen se muestra un
// placeholder con ícono (no rompe el layout).
// ============================================================================

interface DetalleEjercicioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'DetalleEjercicio'>;
  route: RouteProp<RootStackParamList, 'DetalleEjercicio'>;
}

// Etiquetas legibles para los valores canónicos en español del backend.
const GRUPO_LABELS: { [k: string]: string } = {
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  pecho: 'Pecho',
  abdominales: 'Abdominales',
  espalda: 'Espalda',
  piernas: 'Piernas',
  hombros: 'Hombros',
  gluteos: 'Glúteos',
};

const DIFICULTAD_LABELS: { [k: string]: string } = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

const pretty = (raw?: string, map?: { [k: string]: string }): string => {
  if (!raw) return '';
  if (map && map[raw]) return map[raw];
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(/_/g, ' ');
};

export const DetalleEjercicioScreen: React.FC<DetalleEjercicioScreenProps> = ({
  navigation,
  route,
}) => {
  const { ejercicioId } = route.params;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const { data, isLoading, isError, refetch } = useDetalleEjercicioQuery(ejercicioId);

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    if (isError || !data) {
      return (
        <View style={styles.centerFill}>
          <EmptyState
            icon="alert-circle-outline"
            title="No se encontró el ejercicio"
            description="Puede que ya no esté disponible o falló la conexión."
          />
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.accent }]}
            onPress={() => refetch()}
          >
            <Text style={[styles.retryText, { color: colors.background }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    type Meta = { icon: keyof typeof Ionicons.glyphMap; label: string; value: string };
    const metas: Meta[] = (
      [
        { icon: 'body-outline', label: 'Grupo muscular', value: pretty(data.grupoMuscular, GRUPO_LABELS) },
        { icon: 'barbell-outline', label: 'Equipo', value: pretty(data.equipo) },
        { icon: 'speedometer-outline', label: 'Dificultad', value: pretty(data.dificultad, DIFICULTAD_LABELS) },
        { icon: 'fitness-outline', label: 'Tipo', value: pretty(data.tipo) },
      ] as Meta[]
    ).filter((m) => !!m.value);

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Media */}
        <View
          style={[styles.media, { backgroundColor: colors.surface }]}
        >
          {data.imagen ? (
            <Image
              source={{ uri: data.imagen }}
              style={styles.mediaImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="barbell" size={56} color={colors.textMuted} />
          )}
        </View>

        {/* Metadatos */}
        <Card variant="elevated" padding="md" style={styles.metaCard}>
          {metas.map((m, i) => (
            <View
              key={m.label}
              style={[
                styles.metaRow,
                i < metas.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Ionicons name={m.icon} size={18} color={colors.accent} />
              <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>
                {m.label}
              </Text>
              <Text
                style={[styles.metaValue, { color: colors.textPrimary }]}
                numberOfLines={2}
              >
                {m.value}
              </Text>
            </View>
          ))}
        </Card>

        {/* Instrucciones */}
        <Card variant="elevated" padding="md" style={styles.instCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Instrucciones
          </Text>
          {data.instrucciones ? (
            <Text style={[styles.instText, { color: colors.textSecondary }]}>
              {data.instrucciones}
            </Text>
          ) : (
            <Text style={[styles.instText, { color: colors.textMuted }]}>
              Sin instrucciones disponibles para este ejercicio.
            </Text>
          )}
        </Card>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {data?.nombre ?? 'Ejercicio'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Detalle
          </Text>
        </View>
      </View>

      {renderBody()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
  },
  headerSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  media: {
    height: 180,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  metaCard: {
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.sm,
  },
  metaLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    flex: 1,
  },
  metaValue: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    flexShrink: 1,
    textAlign: 'right',
    textTransform: 'capitalize',
  },
  instCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    marginBottom: spacing.sm,
  },
  instText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  retryText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
});

export default DetalleEjercicioScreen;
