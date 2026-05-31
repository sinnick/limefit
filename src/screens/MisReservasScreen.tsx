import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { RootStackParamList, Reserva } from '../types';
import {
  useMisReservasQuery,
  useCancelarReservaMutation,
} from '../services/queries';
import { useUser } from '../store/userStore';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, fontSize } from '../constants/theme';
import { Card, Button, Loading, EmptyState } from '../components/ui';
import { useToast } from '../components/ui/Toast';

// ============================================================================
// MisReservasScreen (CONTRACT-fase4-app.md §4 — Feature INT-4.3).
//
// Reservas activas del socio (useMisReservasQuery → POST /clases/mis-reservas;
// el backend solo devuelve estado "reservada"). Por reserva: nombre/instructor/
// día+hora de la clase, fecha del dictado y botón Cancelar (mutation ONLINE-FIRST
// que invalida CLASES + RESERVAS). Sin store: consume `data` de React Query.
// ============================================================================

interface MisReservasScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MisReservas'>;
}

const DIA_LABEL: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

// Fecha del dictado a etiqueta legible (DD/MM/YYYY). El backend la guarda a
// medianoche UTC; se muestra en UTC para no correr el día por zona horaria.
const formatFecha = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const errorMensaje = (err: unknown, fallback: string): string => {
  const ax = err as AxiosError<{ error?: string }>;
  return ax?.response?.data?.error || fallback;
};

export const MisReservasScreen: React.FC<MisReservasScreenProps> = ({
  navigation,
}) => {
  const { colors } = useTheme();
  const toast = useToast();
  const user = useUser();
  const dni = user?.DNI ?? '';

  const { data, isLoading, isError, refetch, isFetching } =
    useMisReservasQuery(dni);
  const cancelar = useCancelarReservaMutation();

  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const onCancelar = async (reserva: Reserva) => {
    setPendingId(reserva.reservaId);
    try {
      await cancelar.mutateAsync(reserva.claseId);
      toast.success('Reserva cancelada', reserva.clase?.nombre);
    } catch (err) {
      toast.error(errorMensaje(err, 'No se pudo cancelar'), reserva.clase?.nombre);
    } finally {
      setPendingId(null);
    }
  };

  const renderItem = ({ item }: { item: Reserva }) => {
    const procesando = pendingId === item.reservaId;
    const clase = item.clase;

    return (
      <Card variant="elevated" padding="md" style={styles.itemCard}>
        <Text
          style={[styles.itemNombre, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {clase?.nombre ?? 'Clase'}
        </Text>

        <View style={styles.itemMetaRow}>
          {!!clase?.instructor && (
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {clase.instructor}
              </Text>
            </View>
          )}
          {!!clase && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {DIA_LABEL[clase.diaSemana] ?? clase.diaSemana} · {clase.hora}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={[styles.fechaText, { color: colors.textSecondary }]}>
              {formatFecha(item.fecha)}
            </Text>
          </View>
          <Button
            title="Cancelar"
            variant="outline"
            size="sm"
            loading={procesando}
            onPress={() => onCancelar(item)}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Mis Reservas
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tus clases reservadas
          </Text>
        </View>
      </View>

      {isLoading ? (
        <Loading fullScreen message="Cargando reservas..." />
      ) : isError ? (
        <View style={styles.centerFill}>
          <EmptyState
            icon="cloud-offline-outline"
            title="No se pudo cargar"
            description="Revisá tu conexión e intentá de nuevo."
            actionLabel="Reintentar"
            onAction={() => refetch()}
          />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.reservaId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={colors.lime}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No tenés reservas"
              description="Reservá una clase desde la sección Clases."
              actionLabel="Ver clases"
              onAction={() => navigation.navigate('Clases')}
            />
          }
        />
      )}
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
    paddingTop: 56,
    paddingBottom: spacing.sm,
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
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemNombre: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    textTransform: 'capitalize',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  fechaText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default MisReservasScreen;
