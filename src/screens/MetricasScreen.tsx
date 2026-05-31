import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fontFamily, spacing } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList, MetricaCorporal, MedidasCorporales } from '../types';
import { useMetricasQuery } from '../services/queries';
import { useUser, useSettings } from '../store/userStore';
import { useBodyMetricsStore, useBodyMetrics } from '../store/bodyMetricsStore';
import { Card, Input, Button, EmptyState, Loading } from '../components/ui';
import { MetricChart, MetricChartPoint } from '../components/MetricChart';

interface MetricasScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Metricas'>;
}

// Parseo tolerante: "" → undefined, coma decimal → punto.
const parseNum = (s: string): number | undefined => {
  const t = s.trim().replace(',', '.');
  if (t === '') return undefined;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
};

const fmtFechaLarga = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

// Etiquetas legibles para las medidas corporales.
const MEDIDAS_LABEL: Record<keyof MedidasCorporales, string> = {
  pecho: 'Pecho',
  cintura: 'Cintura',
  cadera: 'Cadera',
  brazo: 'Brazo',
  muslo: 'Muslo',
};

export const MetricasScreen: React.FC<MetricasScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const user = useUser();
  const settings = useSettings();
  const dni = user?.DNI || '';

  // LECTURA por React Query (sincroniza al store en efecto). ESCRITURA por store
  // offline-first (addMetric → enqueueMetric). El store es la fuente de verdad UI.
  const { isLoading, refetch, isRefetching } = useMetricasQuery(dni);
  const metrics = useBodyMetrics();
  const addMetric = useBodyMetricsStore((s) => s.addMetric);

  // Estado del formulario (campos como texto; se parsean al guardar).
  const [peso, setPeso] = useState('');
  const [grasa, setGrasa] = useState('');
  const [pecho, setPecho] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [brazo, setBrazo] = useState('');
  const [muslo, setMuslo] = useState('');
  const [notas, setNotas] = useState('');
  const [showMedidas, setShowMedidas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unidad = settings.unidadPeso;

  // Serie para el gráfico: peso corporal en el tiempo (asc lo ordena el chart).
  const pesoSerie = useMemo<MetricChartPoint[]>(
    () =>
      metrics
        .filter((m) => typeof m.peso === 'number')
        .map((m) => ({ fecha: m.fecha, valor: m.peso as number })),
    [metrics]
  );

  const limpiarForm = () => {
    setPeso('');
    setGrasa('');
    setPecho('');
    setCintura('');
    setCadera('');
    setBrazo('');
    setMuslo('');
    setNotas('');
    setShowMedidas(false);
  };

  const guardar = () => {
    setError(null);

    const pesoN = parseNum(peso);
    const grasaN = parseNum(grasa);
    const medidasRaw: MedidasCorporales = {
      pecho: parseNum(pecho),
      cintura: parseNum(cintura),
      cadera: parseNum(cadera),
      brazo: parseNum(brazo),
      muslo: parseNum(muslo),
    };
    // Solo conservar claves con valor definido.
    const medidas: MedidasCorporales = {};
    (Object.keys(medidasRaw) as (keyof MedidasCorporales)[]).forEach((k) => {
      if (medidasRaw[k] !== undefined) medidas[k] = medidasRaw[k];
    });
    const tieneMedidas = Object.keys(medidas).length > 0;

    // Debe haber al menos un dato útil.
    if (pesoN === undefined && grasaN === undefined && !tieneMedidas) {
      setError('Ingresá al menos un dato (peso, % grasa o una medida).');
      return;
    }

    const nueva: MetricaCorporal = {
      id: '', // el store genera id/clientId
      dni,
      fecha: new Date().toISOString(),
      peso: pesoN,
      porcentajeGrasa: grasaN,
      medidas: tieneMedidas ? medidas : undefined,
      notas: notas.trim() || undefined,
    };

    addMetric(nueva); // local + cola offline-first
    limpiarForm();
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando métricas..." />;
  }

  const styles = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Métricas corporales</Text>
          <Text style={styles.headerSubtitle}>
            {metrics.length} registro{metrics.length === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Gráfico de evolución del peso corporal */}
        <Card variant="elevated" padding="lg" style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Evolución del peso</Text>
          {pesoSerie.length === 0 ? (
            <Text style={styles.emptyChart}>
              Registrá tu peso para ver la evolución.
            </Text>
          ) : (
            <MetricChart data={pesoSerie} suffix={unidad} />
          )}
        </Card>

        {/* Formulario de registro */}
        <Card variant="elevated" padding="lg" style={styles.formCard}>
          <Text style={styles.sectionTitle}>Nuevo registro</Text>

          <Input
            label={`Peso (${unidad})`}
            value={peso}
            onChangeText={setPeso}
            keyboardType="decimal-pad"
            placeholder="0"
            leftIcon={
              <Ionicons name="barbell-outline" size={20} color={colors.accent} />
            }
          />

          <Input
            label="% Grasa corporal"
            value={grasa}
            onChangeText={setGrasa}
            keyboardType="decimal-pad"
            placeholder="0"
            leftIcon={
              <Ionicons name="water-outline" size={20} color={colors.accent} />
            }
          />

          {/* Toggle de medidas (perímetros) */}
          <TouchableOpacity
            style={styles.medidasToggle}
            onPress={() => setShowMedidas((v) => !v)}
            activeOpacity={0.7}
          >
            <Text style={styles.medidasToggleText}>Medidas (cm)</Text>
            <Ionicons
              name={showMedidas ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showMedidas && (
            <View>
              <Input
                label="Pecho (cm)"
                value={pecho}
                onChangeText={setPecho}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Input
                label="Cintura (cm)"
                value={cintura}
                onChangeText={setCintura}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Input
                label="Cadera (cm)"
                value={cadera}
                onChangeText={setCadera}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Input
                label="Brazo (cm)"
                value={brazo}
                onChangeText={setBrazo}
                keyboardType="decimal-pad"
                placeholder="0"
              />
              <Input
                label="Muslo (cm)"
                value={muslo}
                onChangeText={setMuslo}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          )}

          <Input
            label="Notas (opcional)"
            value={notas}
            onChangeText={setNotas}
            placeholder="¿Algo a destacar?"
            multiline
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            title="Guardar registro"
            variant="primary"
            fullWidth
            onPress={guardar}
            leftIcon={
              <Ionicons name="save-outline" size={20} color={colors.background} />
            }
          />
        </Card>

        {/* Historial de registros */}
        <Text style={[styles.sectionTitle, styles.historialTitle]}>Historial</Text>

        {metrics.length === 0 ? (
          <EmptyState
            icon="body-outline"
            title="Sin métricas aún"
            description="Registrá tu peso, % de grasa o medidas para seguir tu evolución."
          />
        ) : (
          metrics.map((m) => <MetricaRow key={m.clientId ?? m.id} metrica={m} unidad={unidad} colors={colors} />)
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Fila de historial de una métrica.
interface MetricaRowProps {
  metrica: MetricaCorporal;
  unidad: string;
  colors: ReturnType<typeof useTheme>['colors'];
}

const MetricaRow: React.FC<MetricaRowProps> = ({ metrica, unidad, colors }) => {
  const styles = makeStyles(colors);

  const medidasEntries = metrica.medidas
    ? (Object.keys(metrica.medidas) as (keyof MedidasCorporales)[]).filter(
        (k) => metrica.medidas?.[k] !== undefined
      )
    : [];

  return (
    <Card variant="elevated" padding="lg" style={styles.rowCard}>
      <View style={styles.rowHeader}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.rowDate}>{fmtFechaLarga(metrica.fecha)}</Text>
      </View>

      <View style={styles.rowStats}>
        {typeof metrica.peso === 'number' && (
          <View style={styles.rowStat}>
            <Text style={styles.rowStatValue}>{metrica.peso}</Text>
            <Text style={styles.rowStatLabel}>{unidad}</Text>
          </View>
        )}
        {typeof metrica.porcentajeGrasa === 'number' && (
          <View style={styles.rowStat}>
            <Text style={styles.rowStatValue}>{metrica.porcentajeGrasa}</Text>
            <Text style={styles.rowStatLabel}>% grasa</Text>
          </View>
        )}
      </View>

      {medidasEntries.length > 0 && (
        <View style={styles.medidasChips}>
          {medidasEntries.map((k) => (
            <View key={k} style={styles.chip}>
              <Text style={styles.chipText}>
                {MEDIDAS_LABEL[k]}: {metrica.medidas?.[k]} cm
              </Text>
            </View>
          ))}
        </View>
      )}

      {metrica.notas && <Text style={styles.rowNotas}>{metrica.notas}</Text>}
    </Card>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: 56,
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
    headerTitleWrap: {
      flex: 1,
    },
    headerTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 22,
      color: colors.textPrimary,
    },
    headerSubtitle: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: 40,
      gap: spacing.md,
    },
    sectionTitle: {
      fontFamily: fontFamily.bold,
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    chartCard: {},
    emptyChart: {
      fontFamily: fontFamily.regular,
      fontSize: 14,
      color: colors.textMuted,
      paddingVertical: spacing.lg,
      textAlign: 'center',
    },
    formCard: {},
    medidasToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    medidasToggleText: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorText: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    historialTitle: {
      marginBottom: 0,
      marginTop: spacing.sm,
    },
    rowCard: {},
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.sm,
    },
    rowDate: {
      fontFamily: fontFamily.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    rowStats: {
      flexDirection: 'row',
      gap: spacing.xl,
    },
    rowStat: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    rowStatValue: {
      fontFamily: fontFamily.bold,
      fontSize: 22,
      color: colors.textPrimary,
    },
    rowStatLabel: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: colors.textSecondary,
    },
    medidasChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipText: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: colors.textSecondary,
    },
    rowNotas: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: spacing.sm,
    },
  });

export default MetricasScreen;
