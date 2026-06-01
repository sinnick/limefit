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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AxiosError } from 'axios';
import { RootStackParamList, Clase } from '../types';
import {
  useClasesQuery,
  useReservarClaseMutation,
  useCancelarReservaMutation,
} from '../services/queries';
import { useUser } from '../store/userStore';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { Card, Button, Loading, Badge, EmptyState } from '../components/ui';
import { useToast } from '../components/ui/Toast';

// ============================================================================
// ClasesScreen (CONTRACT-fase4-app.md §4 — Feature INT-4.3).
//
// Lista de clases disponibles del gym (useClasesQuery → POST /clases/list con el
// DNI del socio para recibir `yaReservada`). Por clase: nombre, instructor, día +
// hora, cupo "X/Y" y botón Reservar/Cancelar. ONLINE-FIRST: las mutations van
// directo al backend (control de cupo, 409 "Sin cupo") y refrescan vía invalidate.
// Sin store: la pantalla consume `data` directo de React Query.
// ============================================================================

interface ClasesScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Clases'>;
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

// Mensaje de error de una mutation reservar/cancelar. Prioriza el `error` del body
// del backend (p.ej. "Sin cupo", 409) y cae a un texto genérico si no llega.
const errorMensaje = (err: unknown, fallback: string): string => {
  const ax = err as AxiosError<{ error?: string }>;
  return ax?.response?.data?.error || fallback;
};

export const ClasesScreen: React.FC<ClasesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const user = useUser();
  const dni = user?.DNI ?? '';

  const { data, isLoading, isError, refetch, isFetching } = useClasesQuery(dni);
  const reservar = useReservarClaseMutation();
  const cancelar = useCancelarReservaMutation();

  // claseId en vuelo: para mostrar loading solo en el botón de esa fila y evitar
  // toques dobles mientras la mutation está pendiente.
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const onReservar = async (clase: Clase) => {
    setPendingId(clase.id);
    try {
      await reservar.mutateAsync(clase.id);
      toast.success('Reserva confirmada', clase.nombre);
    } catch (err) {
      toast.error(errorMensaje(err, 'No se pudo reservar'), clase.nombre);
    } finally {
      setPendingId(null);
    }
  };

  const onCancelar = async (clase: Clase) => {
    setPendingId(clase.id);
    try {
      await cancelar.mutateAsync(clase.id);
      toast.success('Reserva cancelada', clase.nombre);
    } catch (err) {
      toast.error(errorMensaje(err, 'No se pudo cancelar'), clase.nombre);
    } finally {
      setPendingId(null);
    }
  };

  const renderItem = ({ item }: { item: Clase }) => {
    const lleno = item.cupoDisponible <= 0;
    const reservada = !!item.yaReservada;
    const procesando = pendingId === item.id;

    return (
      <Card variant="elevated" padding="md" style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <Text
            style={[styles.itemNombre, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          {reservada && <Badge text="Reservada" variant="success" size="sm" />}
        </View>

        <View style={styles.itemMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
              {item.instructor}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
              {DIA_LABEL[item.diaSemana] ?? item.diaSemana} · {item.hora}
            </Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.cupoWrap}>
            <Ionicons
              name="people-outline"
              size={16}
              color={lleno && !reservada ? colors.error : colors.textSecondary}
            />
            <Text
              style={[
                styles.cupoText,
                { color: lleno && !reservada ? colors.error : colors.textSecondary },
              ]}
            >
              {item.cupoOcupado}/{item.cupo}
            </Text>
            {lleno && !reservada && (
              <Text style={[styles.cupoLleno, { color: colors.error }]}>
                Sin cupo
              </Text>
            )}
          </View>

          {reservada ? (
            <Button
              title="Cancelar"
              variant="outline"
              size="sm"
              loading={procesando}
              onPress={() => onCancelar(item)}
            />
          ) : (
            <Button
              title="Reservar"
              variant="primary"
              size="sm"
              loading={procesando}
              disabled={lleno}
              onPress={() => onReservar(item)}
            />
          )}
        </View>
      </Card>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Clases
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Reservá tu cupo
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('MisReservas')}
        >
          <Ionicons name="bookmark-outline" size={22} color={colors.lime} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <Loading fullScreen message="Cargando clases..." />
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
          keyExtractor={(item) => item.id}
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
              icon="calendar-outline"
              title="No hay clases"
              description="Todavía no hay clases disponibles en tu gym."
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemNombre: {
    flex: 1,
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
  cupoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cupoText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
  cupoLleno: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  centerFill: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default ClasesScreen;
