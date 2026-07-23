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
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { diaKey } from '../utils/asistenciaStats';

// ============================================================================
// HabitHeatmap — tracker de constancia colapsable.
//
//  · Colapsado (default): SOLO la semana en curso, 7 cuadrados horizontales.
//    Toda la tarjeta es tocable para abrir.
//  · Expandido: la grilla del mes, navegable a meses anteriores con ‹ ›. Ahí la
//    tarjeta YA NO colapsa al tocarla (evita cerrarla sin querer mientras se
//    navega); el toggle queda en el chevron vertical de la derecha.
//
// No se navega al futuro más allá del mes actual, y al colapsar se vuelve
// siempre al mes de hoy para que la semana mostrada sea la vigente.
//
// Polish (design-eng): la celda de HOY hace pop con spring al marcarse — la
// recompensa de la única acción diaria. El chevron ROTA en vez de cambiar de
// glyph. Cambiar de mes da háptica de selección.
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
  // 0 = mes actual · -1 = anterior · nunca positivo (no se navega al futuro).
  const [offsetMes, setOffsetMes] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const popHoy = useRef(new Animated.Value(1)).current;
  const giro = useRef(new Animated.Value(0)).current;
  const fadeGrilla = useRef(new Animated.Value(1)).current;

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

  const { semanas, filaActual, titulo, diasDelMes, diasSemana, marcadoHoy } = useMemo(() => {
    const set = new Set(fechas.map(diaKey));
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    // Mes visible (el constructor normaliza el desborde de año).
    const visible = new Date(hoy.getFullYear(), hoy.getMonth() + offsetMes, 1);
    const año = visible.getFullYear();
    const mes = visible.getMonth();

    const offsetCol = (visible.getDay() + 6) % 7; // lunes = 0
    const total = new Date(año, mes + 1, 0).getDate();

    const celdas: Celda[] = [];
    for (let i = 0; i < offsetCol; i++) {
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

    // El año solo se muestra cuando no es el actual.
    const nombre =
      año === hoy.getFullYear() ? MESES[mes] : `${MESES[mes]} ${año}`;

    const iFila = idx >= 0 ? idx : filas.length - 1;

    return {
      semanas: filas,
      filaActual: iFila,
      titulo: nombre,
      diasDelMes: celdas.filter((c) => c.asistio).length,
      // El contador tiene que hablar de lo que se está mostrando: colapsado se
      // ve una semana, así que cuenta esa semana — no el mes.
      diasSemana: filas[iFila].filter((c) => c.asistio).length,
      marcadoHoy: set.has(diaKey(hoy.toISOString())),
    };
  }, [fechas, offsetMes]);

  // Pop de la celda de hoy al marcarse. Confirmación, no fiesta.
  const eraMarcado = useRef(marcadoHoy);
  useEffect(() => {
    if (marcadoHoy && !eraMarcado.current && !reduceMotion) {
      popHoy.setValue(1);
      Animated.sequence([
        Animated.spring(popHoy, { toValue: 1.18, speed: 50, bounciness: 10, useNativeDriver: true }),
        Animated.spring(popHoy, { toValue: 1, speed: 20, bounciness: 6, useNativeDriver: true }),
      ]).start();
    }
    eraMarcado.current = marcadoHoy;
  }, [marcadoHoy, reduceMotion, popHoy]);

  const animarLayout = () => {
    if (reduceMotion) return;
    // Spring en vez de curva fija (Apple §4: springs para lo que se toca).
    // El expandir/colapsar es como abrir un drawer → damping 0.8 (leve settle
    // orgánico, el valor que Apple usa para drawers/sheets). El fade de las
    // filas que entran/salen se mantiene en opacity.
    LayoutAnimation.configureNext({
      duration: 300,
      update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  };

  const toggle = () => {
    animarLayout();
    if (!reduceMotion) {
      Animated.timing(giro, {
        toValue: expandido ? 0 : 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      giro.setValue(expandido ? 0 : 1);
    }
    // Al cerrar se vuelve al mes de hoy: la semana mostrada debe ser la vigente.
    if (expandido) setOffsetMes(0);
    setExpandido((v) => !v);
  };

  const cambiarMes = (delta: number) => {
    if (delta > 0 && offsetMes >= 0) return; // nunca al futuro
    Haptics.selectionAsync().catch(() => {});
    animarLayout();
    setOffsetMes((v) => v + delta);
    if (!reduceMotion) {
      fadeGrilla.setValue(0.4);
      Animated.timing(fadeGrilla, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
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
            { backgroundColor: colorFondo(c), borderColor: colorBorde(c) },
            // OJO: nunca `transform: undefined`. En los meses sin "hoy" ninguna
            // celda lleva transform y RN revienta en processTransform
            // ("Cannot read property 'forEach' of null"). Se omite la key.
            c.esHoy ? { transform: [{ scale: popHoy }] } : null,
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

  const enMesActual = offsetMes >= 0;

  const contenido = (
    <>
      <View style={styles.encabezado}>
        {expandido ? (
          <View style={styles.navMes}>
            <Pressable
              onPress={() => cambiarMes(-1)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Mes anterior"
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            </Pressable>

            <Text style={[styles.mes, { color: colors.textPrimary }]}>{titulo}</Text>

            <Pressable
              onPress={() => cambiarMes(1)}
              disabled={enMesActual}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Mes siguiente"
              accessibilityState={{ disabled: enMesActual }}
              style={({ pressed }) => ({ opacity: enMesActual ? 0.25 : pressed ? 0.5 : 1 })}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.mes, { color: colors.textPrimary }]}>Esta semana</Text>
        )}

        {/* Toggle expandir/colapsar: contador + chevron que rota */}
        <Pressable
          onPress={toggle}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={expandido ? 'Ver solo esta semana' : 'Ver el mes completo'}
          accessibilityState={{ expanded: expandido }}
          style={({ pressed }) => [styles.encabezadoDer, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={[styles.contador, { color: colors.textSecondary }]}>
            {expandido
              ? `${diasDelMes} ${diasDelMes === 1 ? 'día' : 'días'}`
              : `${diasSemana} ${diasSemana === 1 ? 'día' : 'días'}`}
          </Text>
          <Animated.View style={{ transform: [{ rotate: rotacion }] }}>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.fila}>
        {INICIALES.map((d, i) => (
          <View key={i} style={styles.inicialWrap}>
            <Text style={[styles.inicial, { color: colors.textMuted }]}>{d}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={{ opacity: expandido ? fadeGrilla : 1 }}>
        {expandido
          ? semanas.map((f, i) => renderFila(f, i))
          : renderFila(semanas[filaActual], filaActual)}
      </Animated.View>
    </>
  );

  // Colapsado: toda la tarjeta abre. Expandido: solo el chevron cierra, para no
  // cerrarla sin querer mientras se navegan los meses.
  if (expandido) {
    return (
      <View style={[styles.contenedor, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {contenido}
      </View>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel="Ver el mes completo"
      accessibilityState={{ expanded: false }}
      style={({ pressed }) => [
        styles.contenedor,
        {
          backgroundColor: pressed ? colors.surface : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      {contenido}
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
  navMes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
