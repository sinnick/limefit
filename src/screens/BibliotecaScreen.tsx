import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, EjercicioBiblioteca } from '../types';
import { useEjerciciosQuery } from '../services/queries';
import { useWorkoutStore } from '../store/workoutStore';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { Card, EmptyState } from '../components/ui';

// ============================================================================
// BibliotecaScreen (CONTRACT-fase2 §4 / §5.4 — Feature 2.1, base de 2.2).
//
// Buscador + filtros (grupo muscular, dificultad, equipo) sobre la biblioteca
// pública del gym (useEjerciciosQuery → POST /ejercicios/search). El set al store
// NO ocurre acá: la pantalla consume `data` directo de React Query (lectura, no
// offline-first).
//
// modoSustitucion (Feature 2.2): cuando WorkoutScreen navega con
// { grupoMuscular, modoSustitucion: true, ejercicioIndex }, el grupo viene
// pre-filtrado y al tocar un ejercicio NO se abre el detalle: se hace el puente
// por el store (setSeleccionSustitucion) + goBack(). Los params de navegación
// deben ser serializables, por eso el objeto Ejercicio viaja por el store, no
// por la ruta (ver workoutStore §2.2).
// ============================================================================

interface BibliotecaScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Biblioteca'>;
  route: RouteProp<RootStackParamList, 'Biblioteca'>;
}

// Grupos musculares del seed (inglés). Se muestran con etiqueta en español pero
// el filtro viaja con el valor crudo del backend (GRUPO_MUSCULAR exacto).
const GRUPOS: { value: string; label: string }[] = [
  { value: 'biceps', label: 'Bíceps' },
  { value: 'triceps', label: 'Tríceps' },
  { value: 'chest', label: 'Pecho' },
  { value: 'abdominals', label: 'Abdominales' },
  { value: 'middle_back', label: 'Espalda' },
  { value: 'quadriceps', label: 'Piernas' },
  { value: 'shoulders', label: 'Hombros' },
  { value: 'glutes', label: 'Glúteos' },
];

const DIFICULTADES: { value: string; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

// Etiqueta legible para el grupo muscular crudo del backend.
const grupoLabel = (value?: string): string => {
  if (!value) return '';
  const found = GRUPOS.find((g) => g.value === value);
  if (found) return found.label;
  // Fallback: capitalizar el crudo (p.ej. "forearms").
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
};

const dificultadLabel = (value?: string): string => {
  if (!value) return '';
  const found = DIFICULTADES.find((d) => d.value === value);
  return found ? found.label : value;
};

export const BibliotecaScreen: React.FC<BibliotecaScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const params = route.params ?? {};
  const modoSustitucion = !!params.modoSustitucion;
  const ejercicioIndex = params.ejercicioIndex;

  const setSeleccionSustitucion = useWorkoutStore(
    (state) => state.setSeleccionSustitucion
  );

  // En modoSustitucion el grupo viene pre-filtrado por el ejercicio actual del
  // workout (sugerir mismo grupo muscular). Es el estado inicial del filtro.
  const [query, setQuery] = useState('');
  const [grupo, setGrupo] = useState<string | undefined>(params.grupoMuscular);
  const [dificultad, setDificultad] = useState<string | undefined>(undefined);

  // La query corre con los filtros estructurados (grupo/dificultad). El texto
  // libre se aplica localmente para no refetchear en cada tecla.
  const { data, isLoading, isError, refetch, isFetching } = useEjerciciosQuery({
    grupoMuscular: grupo,
    dificultad,
    limit: 100,
  });

  const ejercicios = useMemo<EjercicioBiblioteca[]>(() => {
    const lista = data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [data, query]);

  const onSeleccionar = (ejercicio: EjercicioBiblioteca) => {
    if (modoSustitucion && typeof ejercicioIndex === 'number') {
      // 2.2: puente por el store + volver al workout (no abrir detalle).
      setSeleccionSustitucion(ejercicioIndex, ejercicio);
      navigation.goBack();
      return;
    }
    navigation.navigate('DetalleEjercicio', { ejercicioId: ejercicio.id });
  };

  const renderItem = ({ item }: { item: EjercicioBiblioteca }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onSeleccionar(item)}>
      <Card variant="elevated" padding="md" style={styles.itemCard}>
        <View style={styles.itemBody}>
          <Text
            style={[styles.itemNombre, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.nombre}
          </Text>
          <View style={styles.itemMetaRow}>
            {!!item.grupoMuscular && (
              <Text style={[styles.itemMeta, { color: colors.accent }]}>
                {grupoLabel(item.grupoMuscular)}
              </Text>
            )}
            {!!item.equipo && (
              <Text style={[styles.itemMeta, { color: colors.textSecondary }]}>
                {item.equipo.replace(/_/g, ' ')}
              </Text>
            )}
            {!!item.dificultad && (
              <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                {dificultadLabel(item.dificultad)}
              </Text>
            )}
          </View>
        </View>
        <Ionicons
          name={modoSustitucion ? 'swap-horizontal' : 'chevron-forward'}
          size={20}
          color={modoSustitucion ? colors.accent : colors.textMuted}
        />
      </Card>
    </TouchableOpacity>
  );

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
          <Text
            style={[styles.headerTitle, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {modoSustitucion ? 'Sustituir ejercicio' : 'Biblioteca'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {modoSustitucion
              ? 'Elegí un reemplazo del mismo grupo'
              : 'Buscá ejercicios'}
          </Text>
        </View>
      </View>

      {/* Buscador */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros: grupo muscular */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {GRUPOS.map((g) => {
          const activo = grupo === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[
                styles.chip,
                { backgroundColor: activo ? colors.accent : colors.surface },
              ]}
              onPress={() => setGrupo(activo ? undefined : g.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: activo ? colors.background : colors.textSecondary },
                ]}
              >
                {g.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtros: dificultad */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {DIFICULTADES.map((d) => {
          const activo = dificultad === d.value;
          return (
            <TouchableOpacity
              key={d.value}
              style={[
                styles.chipSm,
                {
                  borderColor: activo ? colors.accent : colors.border,
                  backgroundColor: activo ? `${colors.accent}22` : 'transparent',
                },
              ]}
              onPress={() => setDificultad(activo ? undefined : d.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: activo ? colors.accent : colors.textSecondary },
                ]}
              >
                {d.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Lista */}
      {isLoading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={styles.centerFill}>
          <EmptyState
            icon="cloud-offline-outline"
            title="No se pudo cargar"
            description="Revisá tu conexión e intentá de nuevo."
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
      ) : (
        <FlatList
          data={ejercicios}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={isFetching}
          ListEmptyComponent={
            <EmptyState
              icon="barbell-outline"
              title="Sin resultados"
              description="Probá con otro nombre o quitá los filtros."
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
  searchWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    padding: 0,
  },
  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  chipSm: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  itemBody: {
    flex: 1,
  },
  itemNombre: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  itemMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    textTransform: 'capitalize',
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

export default BibliotecaScreen;
