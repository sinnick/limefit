import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { diaKey } from '../utils/asistenciaStats';

// ============================================================================
// HabitHeatmap — tracker de constancia colapsable.
//
//  · Colapsado (default): SOLO la semana en curso, 7 cuadrados horizontales.
//    Ocupa una fila; mantiene la home corta.
//  · Expandido (al tocar): la grilla del mes completo. La semana en curso es
//    una de sus filas, así que la transición se lee como "abrir" la misma vista.
//
// Semántica de la celda: ido = accent sólido · pasado sin ir = bloque apagado ·
// futuro = slot con contorno · hoy = anillo accent. El borde está reservado en
// TODAS las celdas para que marcar asistencia no cambie dimensiones.
// ============================================================================

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface HabitHeatmapProps {
  /** Fechas ISO en las que hubo asistencia. */
  fechas: string[];
}

const GAP = 8;
const RING = 2;
const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Celda {
  dia: number | null; // null = relleno fuera del mes
  asistio: boolean;
  futuro: boolean;
  esHoy: boolean;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ fechas }) => {
  const { colors } = useTheme();
  const [expandido, setExpandido] = useState(false);

  const { semanas, filaActual, nombreMes, diasDelMes } = useMemo(() => {
    const set = new Set(fechas.map(diaKey));
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    const primero = new Date(año, mes, 1);
    // Índice de columna con lunes=0.
    const offset = (primero.getDay() + 6) % 7;
    const totalDias = new Date(año, mes + 1, 0).getDate();

    const celdas: Celda[] = [];
    for (let i = 0; i < offset; i++) {
      celdas.push({ dia: null, asistio: false, futuro: false, esHoy: false });
    }
    for (let d = 1; d <= totalDias; d++) {
      const fecha = new Date(año, mes, d);
      const futuro = fecha.getTime() > hoy.getTime();
      celdas.push({
        dia: d,
        asistio: !futuro && set.has(diaKey(fecha.toISOString())),
        futuro,
        esHoy: fecha.getTime() === hoy.getTime(),
      });
    }
    while (celdas.length % 7 !== 0) {
      celdas.push({ dia: null, asistio: false, futuro: false, esHoy: false });
    }

    const filas: Celda[][] = [];
    for (let i = 0; i < celdas.length; i += 7) filas.push(celdas.slice(i, i + 7));

    const idxFilaActual = filas.findIndex((f) => f.some((c) => c.esHoy));

    // Días del mes con asistencia (para el contador del encabezado).
    const cuenta = celdas.filter((c) => c.asistio).length;

    return {
      semanas: filas,
      filaActual: idxFilaActual >= 0 ? idxFilaActual : filas.length - 1,
      nombreMes: MESES[mes],
      diasDelMes: cuenta,
    };
  }, [fechas]);

  const toggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
    );
    setExpandido((v) => !v);
  };

  const colorFondo = (c: Celda): string => {
    if (c.dia === null) return 'transparent';
    if (c.asistio) return colors.accent;
    if (c.futuro) return 'transparent';
    return colors.surfaceLight;
  };

  const colorBorde = (c: Celda): string => {
    if (c.dia === null) return 'transparent';
    if (c.esHoy) return c.asistio ? colors.accentLight : colors.accent;
    if (c.futuro) return colors.border;
    return 'transparent';
  };

  const renderFila = (fila: Celda[], key: number) => (
    <View key={key} style={styles.fila}>
      {fila.map((c, i) => (
        <View
          key={i}
          style={[
            styles.celda,
            { backgroundColor: colorFondo(c), borderColor: colorBorde(c) },
          ]}
        >
          {c.dia !== null && (
            <Text
              style={[
                styles.celdaTexto,
                {
                  color: c.asistio
                    ? colors.white
                    : c.futuro
                      ? colors.textMuted
                      : colors.textSecondary,
                },
              ]}
            >
              {c.dia}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={expandido ? 'Ver solo esta semana' : 'Ver el mes completo'}
      accessibilityState={{ expanded: expandido }}
      style={({ pressed }) => [
        styles.contenedor,
        {
          backgroundColor: pressed ? colors.surface : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Encabezado: mes + contador + affordance */}
      <View style={styles.encabezado}>
        <Text style={[styles.mes, { color: colors.textPrimary }]}>
          {expandido ? nombreMes : 'Esta semana'}
        </Text>
        <View style={styles.encabezadoDer}>
          <Text style={[styles.contador, { color: colors.textSecondary }]}>
            {diasDelMes} {diasDelMes === 1 ? 'día' : 'días'}
          </Text>
          <Ionicons
            name={expandido ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      </View>

      {/* Cabecera de días */}
      <View style={styles.fila}>
        {INICIALES.map((d, i) => (
          <View key={i} style={styles.inicialWrap}>
            <Text style={[styles.inicial, { color: colors.textMuted }]}>{d}</Text>
          </View>
        ))}
      </View>

      {expandido
        ? semanas.map((f, i) => renderFila(f, i))
        : renderFila(semanas[filaActual], filaActual)}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mes: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    letterSpacing: 1,
  },
  encabezadoDer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contador: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
  },
  fila: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  inicialWrap: {
    flex: 1,
    alignItems: 'center',
  },
  inicial: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
  celda: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celdaTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
  },
});

export default HabitHeatmap;
