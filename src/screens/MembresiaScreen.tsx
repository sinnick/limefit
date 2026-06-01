import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontFamily, shadows } from '../constants/theme';
import { RootStackParamList } from '../types';
import { useUser } from '../store/userStore';
import { useMembresiaQuery } from '../services/queries';
import { Card, Loading, EmptyState } from '../components/ui';

interface MembresiaScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Membresia'>;
}

// Etiqueta + color del estado de cuota. `estado` es un string crudo del backend
// (union abierta), así que mapeamos los valores conocidos y caemos a un default seguro.
const estadoMeta = (
  estado?: string
): { label: string; color: string; icon: keyof typeof Ionicons.glyphMap } => {
  switch (estado) {
    case 'al_dia':
      return { label: 'Al día', color: colors.success, icon: 'checkmark-circle' };
    case 'vencido':
      return { label: 'Vencida', color: colors.error, icon: 'alert-circle' };
    case 'suspendida':
      return { label: 'Suspendida', color: colors.warning, icon: 'pause-circle' };
    default:
      return {
        label: estado ?? 'Sin estado',
        color: colors.textMuted,
        icon: 'help-circle',
      };
  }
};

const formatFecha = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDiasRestantes = (dias?: number): string => {
  if (dias === undefined || dias === null) return '';
  if (dias < 0) {
    const n = Math.abs(dias);
    return `Vencida hace ${n} ${n === 1 ? 'día' : 'días'}`;
  }
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;
};

export const MembresiaScreen: React.FC<MembresiaScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const user = useUser();
  const dni = user?.DNI ?? '';

  const {
    data: membresia,
    isLoading,
    isRefetching,
    refetch,
  } = useMembresiaQuery(dni);

  if (isLoading) {
    return <Loading fullScreen message="Cargando membresía..." />;
  }

  const tieneMembresia = membresia?.tieneMembresia ?? false;
  const meta = estadoMeta(membresia?.estado);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.lime}
          />
        }
      >
        <Text style={styles.title}>Mi membresía</Text>

        {!tieneMembresia ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="card-outline"
              title="Sin membresía activa"
              description="No encontramos una membresía asociada a tu cuenta. Acercate a recepción para activarla."
            />
          </View>
        ) : (
          <>
            {/* Badge de estado */}
            <Card variant="default" padding="lg">
              <View style={styles.estadoRow}>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: `${meta.color}20` },
                  ]}
                >
                  <Ionicons name={meta.icon} size={22} color={meta.color} />
                  <Text style={[styles.estadoLabel, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.diasRestantes}>
                {formatDiasRestantes(membresia?.diasRestantes)}
              </Text>
            </Card>

            {/* Detalle del plan */}
            <Card variant="default" padding="none" style={styles.detalleCard}>
              <View style={styles.detalleRow}>
                <View style={styles.detalleIcon}>
                  <Ionicons name="ribbon-outline" size={22} color={colors.lime} />
                </View>
                <View style={styles.detalleContent}>
                  <Text style={styles.detalleLabel}>Plan</Text>
                  <Text style={styles.detalleValue}>
                    {membresia?.planNombre || 'Sin nombre'}
                  </Text>
                </View>
              </View>

              <View style={styles.detalleRow}>
                <View style={styles.detalleIcon}>
                  <Ionicons name="calendar-outline" size={22} color={colors.lime} />
                </View>
                <View style={styles.detalleContent}>
                  <Text style={styles.detalleLabel}>Inicio</Text>
                  <Text style={styles.detalleValue}>
                    {formatFecha(membresia?.fechaInicio)}
                  </Text>
                </View>
              </View>

              <View style={[styles.detalleRow, styles.detalleRowLast]}>
                <View style={styles.detalleIcon}>
                  <Ionicons name="flag-outline" size={22} color={colors.lime} />
                </View>
                <View style={styles.detalleContent}>
                  <Text style={styles.detalleLabel}>Vencimiento</Text>
                  <Text style={styles.detalleValue}>
                    {formatFecha(membresia?.fechaFin)}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: 24,
  },
  emptyWrap: {
    marginTop: 40,
  },
  estadoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
  },
  estadoLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
  },
  diasRestantes: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 14,
  },
  detalleCard: {
    marginTop: 16,
    ...shadows.sm,
  },
  detalleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detalleRowLast: {
    borderBottomWidth: 0,
  },
  detalleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.lime}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detalleContent: {
    flex: 1,
  },
  detalleLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  detalleValue: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 2,
  },
});

export default MembresiaScreen;
