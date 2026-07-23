import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  AccessibilityInfo,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { diaKey } from '../utils/asistenciaStats';

// ============================================================================
// HabitHeatmap — tracker de constancia colapsable.
//
//  · Colapsado (default): SOLO la semana en curso, 7 cuadrados horizontales.
//  · Expandido (al tocar): la grilla del mes completo, con la semana en curso
//    como una de sus filas — la transición se lee como abrir la misma vista.
//
// Polish (design-eng): la celda de HOY hace un pop con spring cuando se marca
// la asistencia — es la recompensa de la única acción diaria de la app. El
// chevron ROTA en vez de intercambiar glyph (continuidad, no reemplazo).
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
  const [reduceMotion, setReduceMotion] = useState(false);

  // Pop de la celda de hoy al marcarse (ver useEffect más abajo).
  const popHoy = useRef(new Animated.Value(1)).current;
  // Rotación del chevron: 0 = colapsado, 1 = expandido.
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (vivo) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  const { semanas, filaActual, nombreMes, diasDelMes, marcadoHoy } = useMemo(() => {
    const set = new Set(fechas.map(diaKey));
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();

    const primero = new Date(año, mes, 1);
    const offset = (primero.getDay() + 6) % 7; // lunes = 0
    const total = new Date(año, mes + 1, 0).getDate();

    const celdas: Celda[] = [];
    for (let i = 0; i < offset; i++) {
      celdas.push({ dia: null, asistio: false, futuro: false, esHoy: false });
    }
    for (let d = 1; d <= total; d++) {
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
    const idx = filas.findIndex((f) => f.some((c) => c.esHoy));

    return {
      semanas: filas,
      filaActual: idx >= 0 ? idx : filas.length - 1,
      nombreMes: MESES[mes],
      diasDelMes: celdas.filter((c) => c.asistio).length,
      marcadoHoy: set.has(diaKey(hoy.toISOString())),
    };
  }, [fechas]);

  // El momento: cuando hoy pasa a marcado, la celda hace pop. Spring corto y
  // sin rebote exagerado — confirmación, no fiesta.
  const eraMarcado = useRef(marcadoHoy);
  useEffect(() => {
    if (marcadoHoy && !eraMarcado.current && !reduceMotion) {
      popHoy.setValue(1);
      Animated.sequence([
        Animated.spring(popHoy, {
          toValue: 1.18,
          speed: 50,
          bounciness: 10,
          useNativeDriver: true,
        }),
        Animated.spring(popHoy, {
          toValue: 1,
          speed: 20,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
    eraMarcado.current = marcadoHoy;
  }, [marcadoHoy, reduceMotion, popHoy]);

  const toggle = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(
          220,
          LayoutAnimation.Types.easeInEaseOut,
          LayoutAnimation.Properties.opacity
        )
      );
      Animated.timing(giro, {
        toValue: expandido ? 0 : 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      giro.setValue(expandido ? 0 : 1);
    }
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
        <Animated.View
          key={i}
          style={[
            styles.celda,
            {
              backgroundColor: colorFondo(c),
              borderColor: colorBorde(c),
              transform: c.esHoy ? [{ scale: popHoy }] : undefined,
            },
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
        </Animated.View>
      ))}
    </View>
  );

  const rotacion = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

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
      <View style={styles.encabezado}>
        <Text style={[styles.mes, { color: colors.textPrimary }]}>
          {expandido ? nombreMes : 'Esta semana'}
        </Text>
        <View style={styles.encabezadoDer}>
          <Text style={[styles.contador, { color: colors.textSecondary }]}>
            {diasDelMes} {diasDelMes === 1 ? 'día' : 'días'}
          </Text>
          {/* Un solo glyph que rota: continuidad en vez de swap */}
          <Animated.View style={{ transform: [{ rotate: rotacion }] }}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Animated.View>
        </View>
      </View>

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
    borderWidth: StyleSheet.hairlineWidth,
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
