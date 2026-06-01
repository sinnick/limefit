import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { RootStackParamList, WorkoutCompletado } from '../types';
import { useHistorialWorkouts } from '../store/workoutStore';
import { useRutinas } from '../store/rutinasStore';
import { WorkoutCalendar, dateKey, diaSemanaToGetDay } from '../components/WorkoutCalendar';

// ============================================================================
// CalendarioScreen (CONTRACT-fase1 §3.2 / 1.6).
//
// Muestra un calendario mensual custom (WorkoutCalendar) que marca:
//  - días con workout completado (workoutStore.historialWorkouts → fecha)
//  - días programados según diasSemana de las rutinas asignadas (rutinasStore)
// Tap en un día con workout → muestra el detalle del/los workout(s) de ese día.
// ============================================================================

interface CalendarioScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Calendario'>;
}

export const CalendarioScreen: React.FC<CalendarioScreenProps> = ({ navigation }) => {
  const { colors, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const historial = useHistorialWorkouts();
  const rutinas = useRutinas();

  // Mes mostrado (cualquier fecha dentro del mes). Empieza en el mes actual.
  const [month, setMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Días con workout completado (clave "YYYY-MM-DD" → lista de workouts).
  const workoutsPorDia = useMemo(() => {
    const map = new Map<string, WorkoutCompletado[]>();
    historial.forEach((w) => {
      const key = dateKey(new Date(w.fecha));
      const arr = map.get(key);
      if (arr) arr.push(w);
      else map.set(key, [w]);
    });
    return map;
  }, [historial]);

  const diasConWorkout = useMemo(
    () => new Set(workoutsPorDia.keys()),
    [workoutsPorDia]
  );

  // Días programados (índices Date.getDay() 0..6) según diasSemana de todas
  // las rutinas asignadas.
  const diasProgramados = useMemo(() => {
    const set = new Set<number>();
    rutinas.forEach((r) => {
      (r.diasSemana ?? []).forEach((d) => set.add(diaSemanaToGetDay(d)));
    });
    return set;
  }, [rutinas]);

  const goPrevMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const goNextMonth = () =>
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const handleDayPress = (key: string) => {
    // Toggle: si ya está seleccionado, deseleccionar.
    setSelectedKey((prev) => (prev === key ? null : key));
  };

  const selectedWorkouts = selectedKey ? workoutsPorDia.get(selectedKey) ?? [] : [];

  const selectedDateLabel = useMemo(() => {
    if (!selectedKey) return '';
    // selectedKey "YYYY-MM-DD" → fecha local.
    const [y, m, d] = selectedKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [selectedKey]);

  const totalEntrenos = historial.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con back y título */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Calendario</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {totalEntrenos} entrenamiento{totalEntrenos === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={shadows.md}>
          <WorkoutCalendar
            month={month}
            diasConWorkout={diasConWorkout}
            diasProgramados={diasProgramados}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onDayPress={handleDayPress}
            selectedKey={selectedKey}
          />
        </View>

        {/* Detalle del día seleccionado */}
        {selectedKey && (
          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.detailDate, { color: colors.textPrimary }]}>
              {selectedDateLabel}
            </Text>

            {selectedWorkouts.length === 0 ? (
              <Text style={[styles.detailEmpty, { color: colors.textMuted }]}>
                Sin entrenamientos este día.
              </Text>
            ) : (
              selectedWorkouts.map((w) => (
                <View
                  key={w.id}
                  style={[styles.workoutRow, { borderColor: colors.border }]}
                >
                  <View style={styles.workoutRowMain}>
                    <Text
                      style={[styles.workoutNombre, { color: colors.textPrimary }]}
                    >
                      {w.rutinaNombre}
                    </Text>
                    <Text
                      style={[styles.workoutDia, { color: colors.textSecondary }]}
                    >
                      {w.diaNombre}
                    </Text>
                  </View>
                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={16} color={colors.accent} />
                      <Text style={[styles.statText, { color: colors.textPrimary }]}>
                        {w.duracion} min
                      </Text>
                    </View>
                    {w.prsLogrados > 0 && (
                      <View style={styles.statItem}>
                        <Ionicons name="trophy-outline" size={16} color={colors.accent} />
                        <Text style={[styles.statText, { color: colors.textPrimary }]}>
                          {w.prsLogrados} PR{w.prsLogrados === 1 ? '' : 's'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
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
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  detailCard: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  detailDate: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textTransform: 'capitalize',
    marginBottom: spacing.sm,
  },
  detailEmpty: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  workoutRowMain: {
    flex: 1,
  },
  workoutNombre: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
  },
  workoutDia: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
});

export default CalendarioScreen;
