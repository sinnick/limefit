import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { DiaSemana } from '../types';

// ============================================================================
// WorkoutCalendar (CONTRACT-fase1 §4.2 / 1.6) — grid de 7 columnas, custom,
// SIN dependencias nuevas (no react-native-calendars). Un mes = hasta 42 celdas.
//
// - Marca los días con workout completado (set `diasConWorkout`, claves "YYYY-MM-DD").
// - Marca los días programados según diasSemana de las rutinas (set `diasProgramados`,
//   números 0..6 = domingo..sábado, alineado con Date.getDay()).
// - Permite navegar mes a mes y tocar un día (onDayPress con la clave "YYYY-MM-DD").
// ============================================================================

// Lunes-first para coincidir con la cultura es-ES. Date.getDay(): 0=domingo..6=sábado.
const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// Mapea DiaSemana (string) → índice de Date.getDay() (0=domingo..6=sábado).
const DIA_SEMANA_TO_GETDAY: Record<DiaSemana, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

export const diaSemanaToGetDay = (dia: DiaSemana): number => DIA_SEMANA_TO_GETDAY[dia];

// Clave canónica de fecha local "YYYY-MM-DD" (sin desfase de zona horaria).
export const dateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface CalendarCell {
  date: Date | null; // null = celda de relleno (otro mes)
  key: string;
}

interface WorkoutCalendarProps {
  // Mes mostrado: cualquier fecha dentro del mes (se usan año/mes).
  month: Date;
  diasConWorkout: Set<string>; // claves "YYYY-MM-DD" con workout completado
  diasProgramados: Set<number>; // índices Date.getDay() (0..6) programados
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayPress?: (key: string, date: Date) => void;
  selectedKey?: string | null;
}

export const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({
  month,
  diasConWorkout,
  diasProgramados,
  onPrevMonth,
  onNextMonth,
  onDayPress,
  selectedKey,
}) => {
  const { colors } = useTheme();

  const todayKey = useMemo(() => dateKey(new Date()), []);

  // Construye las 6 semanas (42 celdas) del mes, lunes-first.
  const cells = useMemo<CalendarCell[]>(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // getDay(): 0=domingo..6=sábado → desplazamiento para lunes-first.
    const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

    const result: CalendarCell[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      result.push({ date: null, key: `blank-lead-${i}` });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      result.push({ date, key: dateKey(date) });
    }
    // Relleno final hasta múltiplo de 7.
    while (result.length % 7 !== 0) {
      result.push({ date: null, key: `blank-trail-${result.length}` });
    }
    return result;
  }, [month]);

  const monthLabel = useMemo(
    () =>
      month.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    [month]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header: navegación de mes */}
      <View style={styles.header}>
        <Pressable
          onPress={onPrevMonth}
          hitSlop={12}
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
          {monthLabel}
        </Text>
        <Pressable
          onPress={onNextMonth}
          hitSlop={12}
          style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* Encabezados de día de semana */}
      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={`wd-${i}`} style={styles.cell}>
            <Text style={[styles.weekdayText, { color: colors.textMuted }]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid de días */}
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (!cell.date) {
            return <View key={cell.key} style={styles.cell} />;
          }
          const key = cell.key;
          const dayNum = cell.date.getDate();
          const hasWorkout = diasConWorkout.has(key);
          const isProgramado = diasProgramados.has(cell.date.getDay());
          const isToday = key === todayKey;
          const isSelected = selectedKey === key;

          return (
            <Pressable
              key={key}
              style={styles.cell}
              onPress={() => onDayPress?.(key, cell.date as Date)}
              accessibilityRole="button"
              accessibilityLabel={`Día ${dayNum}${hasWorkout ? ', entrenado' : ''}${
                isProgramado ? ', programado' : ''
              }`}
            >
              <View
                style={[
                  styles.dayInner,
                  hasWorkout && { backgroundColor: colors.accent },
                  !hasWorkout && isProgramado && {
                    borderWidth: 1.5,
                    borderColor: colors.accent,
                  },
                  isToday && !hasWorkout && {
                    borderWidth: 1.5,
                    borderColor: colors.textMuted,
                  },
                  isSelected && {
                    borderWidth: 2,
                    borderColor: colors.info,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: hasWorkout ? colors.black : colors.textPrimary },
                    isToday && !hasWorkout && { fontFamily: fontFamily.bold },
                  ]}
                >
                  {dayNum}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Entrenado
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              { borderWidth: 1.5, borderColor: colors.accent },
            ]}
          />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>
            Programado
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // 7 columnas: cada celda ocupa 1/7 del ancho.
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayInner: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
  },
  weekdayText: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
  },
});

export default WorkoutCalendar;
