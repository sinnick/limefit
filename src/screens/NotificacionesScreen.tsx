import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontFamily, spacing } from '../constants/theme';
import { RootStackParamList, DiaSemana } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useRutinas } from '../store/rutinasStore';
import { useNotificacionesStore } from '../store/notificacionesStore';
import {
  pedirPermisoNotificaciones,
  agendarRecordatorios,
  cancelarRecordatorios,
} from '../services/notifications';
import { useToast } from '../components/ui/Toast';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notificaciones'>;
}

const ORDEN: DiaSemana[] = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo',
];

export const NotificacionesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const toast = useToast();
  const rutinas = useRutinas();
  const { activo, hour, minute, setActivo, setHora, setPermiso } =
    useNotificacionesStore();

  // Días de entrenamiento = unión de los DIAS_SEMANA de las rutinas asignadas.
  const dias = useMemo<DiaSemana[]>(() => {
    const set = new Set<DiaSemana>();
    rutinas.forEach((r) => (r.diasSemana ?? []).forEach((d) => set.add(d)));
    return ORDEN.filter((d) => set.has(d));
  }, [rutinas]);

  const hhmm = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const reagendar = useCallback(
    async (nuevoActivo: boolean, h: number, m: number) => {
      if (!nuevoActivo) {
        await cancelarRecordatorios();
        return;
      }
      if (!dias.length) {
        toast.error('No tenés días de entrenamiento en tus rutinas asignadas.');
        setActivo(false);
        return;
      }
      const ok = await pedirPermisoNotificaciones();
      setPermiso(ok);
      if (!ok) {
        toast.error('Sin permiso de notificaciones. Activalo en Ajustes del sistema.');
        setActivo(false);
        return;
      }
      const n = await agendarRecordatorios(dias, h, m);
      toast.success(`Recordatorios activados para ${n} día(s) a las ${hhmm}.`);
    },
    [dias, toast, setActivo, setPermiso, hhmm]
  );

  const onToggle = useCallback(
    (value: boolean) => {
      setActivo(value);
      reagendar(value, hour, minute);
    },
    [setActivo, reagendar, hour, minute]
  );

  const cambiarHora = useCallback(
    (delta: number) => {
      const nuevo = (hour + delta + 24) % 24;
      setHora(nuevo, minute);
      if (activo) reagendar(true, nuevo, minute);
    },
    [hour, minute, setHora, activo, reagendar]
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Recordatorios</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Recordatorios de entrenamiento</Text>
              <Text style={styles.rowSubtitle}>
                Te avisamos los días que entrenás según tus rutinas asignadas.
              </Text>
            </View>
            <Switch
              value={activo}
              onValueChange={onToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Horario del aviso</Text>
          <View style={styles.horaRow}>
            <TouchableOpacity style={styles.horaBtn} onPress={() => cambiarHora(-1)}>
              <Ionicons name="remove" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.hora}>{hhmm}</Text>
            <TouchableOpacity style={styles.horaBtn} onPress={() => cambiarHora(1)}>
              <Ionicons name="add" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Días de entrenamiento</Text>
          {dias.length ? (
            <View style={styles.diasWrap}>
              {dias.map((d) => (
                <View key={d} style={styles.diaChip}>
                  <Text style={styles.diaChipText}>{d}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.rowSubtitle}>
              No hay días en tus rutinas asignadas todavía.
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.textPrimary },
    content: { padding: spacing.md, gap: spacing.md },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.md,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowText: { flex: 1 },
    rowTitle: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.textPrimary },
    rowSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    label: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    horaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
    horaBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    hora: { fontFamily: fontFamily.bold, fontSize: 32, color: colors.textPrimary, minWidth: 110, textAlign: 'center' },
    diasWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    diaChip: {
      backgroundColor: colors.surface,
      borderRadius: 999,
      paddingVertical: 6,
      paddingHorizontal: 14,
    },
    diaChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textPrimary, textTransform: 'capitalize' },
  });

export default NotificacionesScreen;
