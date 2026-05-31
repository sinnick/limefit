import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Record, RecordHistorial } from '../types';
import { recordsApi } from '../services/api';
import { useUser, useSettings } from '../store/userStore';
import { useRecordByEjercicio } from '../store/recordsStore';
import { useTheme } from '../hooks/useTheme';
import { fontFamily, spacing, borderRadius, fontSize } from '../constants/theme';
import { Card, EmptyState } from '../components/ui';
import { ProgressionChart, ProgressionPoint } from '../components/ProgressionChart';
import { LoadSuggestionBadge } from '../components/LoadSuggestionBadge';
import { useLoadSuggestion } from '../hooks/useLoadSuggestion';

// ============================================================================
// RecordDetailScreen (CONTRACT-fase1 §3.2 / 1.2 — Progresión por ejercicio).
//
// Grafica la progresión (peso / volumen vs tiempo) de UN ejercicio. Datos:
//   - recordsStore.personalRecords[ejercicioId].historial (offline-first, inmediato)
//   - recordsApi.getByEjercicio(dni, ejercicioId) (servidor, refresca al entrar)
// Eje Y en settings.unidadPeso. Los PRs (mejor peso a la fecha) se resaltan.
// ============================================================================

type Metric = 'peso' | 'volumen';

interface RecordDetailScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RecordDetail'>;
  route: RouteProp<RootStackParamList, 'RecordDetail'>;
}

// Punto unificado para el gráfico, derivado tanto del historial local como de
// los Records del servidor.
interface Punto {
  fecha: string;
  peso: number;
  reps: number;
}

export const RecordDetailScreen: React.FC<RecordDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { ejercicioId, ejercicioNombre } = route.params;
  const { colors, shadows } = useTheme();
  const user = useUser();
  const settings = useSettings();
  const pr = useRecordByEjercicio(ejercicioId);

  // 5.4a: sugerencia de carga para el próximo entrenamiento (informativa,
  // post-workout). Misma fuente que WorkoutScreen vía el hook fino; este screen
  // solo consume el LoadSuggestion, no recalcula la heurística.
  const sugerencia = useLoadSuggestion(ejercicioId);

  const [metric, setMetric] = useState<Metric>('peso');
  const [remoto, setRemoto] = useState<Record[] | null>(null);
  const [cargando, setCargando] = useState(false);

  const nombre = ejercicioNombre ?? pr?.ejercicioNombre ?? 'Ejercicio';
  const unidad = settings.unidadPeso; // 'kg' | 'lb'

  // Traer historial del servidor (refresca lo local). No bloquea: si falla, se
  // usan los datos del store igual (offline-first).
  useEffect(() => {
    let activo = true;
    if (!user?.DNI) return;
    setCargando(true);
    recordsApi
      .getByEjercicio(user.DNI, ejercicioId)
      .then((records) => {
        if (activo) setRemoto(records);
      })
      .catch(() => {
        if (activo) setRemoto(null);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [user?.DNI, ejercicioId]);

  // Fusionar fuentes: preferir servidor si existe, si no el historial local.
  const puntos = useMemo<Punto[]>(() => {
    let base: Punto[] = [];
    if (remoto && remoto.length > 0) {
      base = remoto.map((r) => ({ fecha: r.fecha, peso: r.peso, reps: r.reps }));
    } else if (pr?.historial?.length) {
      base = pr.historial.map((h: RecordHistorial) => ({
        fecha: h.fecha,
        peso: h.peso,
        reps: h.reps,
      }));
    }
    return base
      .filter((p) => p.fecha && Number.isFinite(p.peso))
      .sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      );
  }, [remoto, pr]);

  // Construir los puntos del gráfico según métrica, resaltando los PRs (cada
  // vez que el peso supera el máximo histórico hasta ese momento).
  const chartData = useMemo<ProgressionPoint[]>(() => {
    let maxPeso = -Infinity;
    return puntos.map((p) => {
      const esPR = p.peso > maxPeso;
      if (esPR) maxPeso = p.peso;
      const valor = metric === 'peso' ? p.peso : p.peso * p.reps;
      return { fecha: p.fecha, valor, highlight: metric === 'peso' && esPR };
    });
  }, [puntos, metric]);

  // Métricas resumen.
  const resumen = useMemo(() => {
    if (puntos.length === 0) return null;
    const pesos = puntos.map((p) => p.peso);
    const maxPeso = Math.max(...pesos);
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    const deltaPeso = ultimo.peso - primero.peso;
    const maxVolumen = Math.max(...puntos.map((p) => p.peso * p.reps));
    return { maxPeso, deltaPeso, maxVolumen, total: puntos.length };
  }, [puntos]);

  const unidadEje = metric === 'peso' ? unidad : `${unidad}·reps`;

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
            {nombre}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Progresión
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle métrica */}
        <View style={[styles.toggleRow, { backgroundColor: colors.surface }]}>
          {(['peso', 'volumen'] as Metric[]).map((m) => {
            const activo = metric === m;
            return (
              <TouchableOpacity
                key={m}
                style={[
                  styles.toggleTab,
                  activo && { backgroundColor: colors.accent },
                ]}
                onPress={() => setMetric(m)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: activo ? colors.background : colors.textSecondary },
                  ]}
                >
                  {m === 'peso' ? 'Peso' : 'Volumen'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Gráfico */}
        <Card variant="elevated" padding="md" style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              {metric === 'peso' ? `Peso máximo (${unidad})` : `Volumen (${unidad}·reps)`}
            </Text>
            {cargando && (
              <ActivityIndicator size="small" color={colors.accent} />
            )}
          </View>

          {chartData.length === 0 ? (
            <EmptyState
              icon="analytics-outline"
              title="Sin progresión aún"
              description="Registra entrenamientos de este ejercicio para ver tu evolución."
            />
          ) : (
            <ProgressionChart data={chartData} unidad={unidadEje} height={240} />
          )}
        </Card>

        {/* 5.4a: sugerencia de carga para el próximo entrenamiento (informativa) */}
        {sugerencia.basadoEn !== 'sin_datos' && (
          <Card variant="elevated" padding="md" style={styles.sugerenciaCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Sugerencia para el próximo entrenamiento
            </Text>
            <View style={styles.sugerenciaBadgeWrap}>
              <LoadSuggestionBadge suggestion={sugerencia} compact />
            </View>
            <Text style={[styles.sugerenciaRazon, { color: colors.textSecondary }]}>
              {sugerencia.razon}
            </Text>
          </Card>
        )}

        {/* Resumen */}
        {resumen && (
          <View style={styles.statsRow}>
            <Card
              variant="elevated"
              padding="md"
              style={{ ...styles.statCard, ...shadows.sm }}
            >
              <Ionicons name="barbell" size={20} color={colors.accent} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {resumen.maxPeso} {unidad}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Peso máx
              </Text>
            </Card>
            <Card
              variant="elevated"
              padding="md"
              style={{ ...styles.statCard, ...shadows.sm }}
            >
              <Ionicons
                name={resumen.deltaPeso >= 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={resumen.deltaPeso >= 0 ? colors.success : colors.error}
              />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {resumen.deltaPeso >= 0 ? '+' : ''}
                {resumen.deltaPeso} {unidad}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Progreso
              </Text>
            </Card>
            <Card
              variant="elevated"
              padding="md"
              style={{ ...styles.statCard, ...shadows.sm }}
            >
              <Ionicons name="layers" size={20} color={colors.info} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {resumen.total}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Registros
              </Text>
            </Card>
          </View>
        )}

        {/* Historial detallado */}
        {puntos.length > 0 && (
          <Card variant="elevated" padding="md" style={styles.historyCard}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Historial
            </Text>
            {[...puntos]
              .sort(
                (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              )
              .map((p, i) => (
                <View
                  key={`${p.fecha}-${i}`}
                  style={[
                    styles.historyRow,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <Text
                    style={[styles.historyDate, { color: colors.textSecondary }]}
                  >
                    {new Date(p.fecha).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text
                    style={[styles.historyValue, { color: colors.textPrimary }]}
                  >
                    {p.peso} {unidad} × {p.reps}
                  </Text>
                  <Text style={[styles.historyVol, { color: colors.textMuted }]}>
                    {(p.peso * p.reps).toFixed(0)} vol
                  </Text>
                </View>
              ))}
          </Card>
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
    paddingHorizontal: spacing.md,
    paddingTop: 56,
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
  toggleRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
  },
  chartCard: {
    marginBottom: spacing.md,
  },
  sugerenciaCard: {
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  sugerenciaBadgeWrap: {
    marginTop: spacing.sm,
  },
  sugerenciaRazon: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  chartTitle: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    marginTop: 6,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  historyCard: {
    marginBottom: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyDate: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    flex: 1,
  },
  historyValue: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    flex: 1,
    textAlign: 'center',
  },
  historyVol: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    flex: 1,
    textAlign: 'right',
  },
});

export default RecordDetailScreen;
