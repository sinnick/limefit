import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';

// ============================================================================
// HabitHeatmap — grilla de asistencia estilo "commit graph" de GitHub.
// Recibe un listado de fechas ISO (los días que se fue al gym) y dibuja una
// cuadrícula de 7 filas (días de la semana, domingo arriba) × N columnas
// (semanas), con scroll horizontal. Cada celda es binaria: se fue / no se fue.
// Toda la aritmética de fechas es INMUTABLE (nunca `Date.prototype.setX` sobre
// una fecha compartida) para no repetir el bug de mutación de InicioScreen.
// ============================================================================

interface HabitHeatmapProps {
  /** Fechas ISO en las que hubo asistencia (una o varias por día da igual). */
  fechas: string[];
  /** Cuántas semanas mostrar hacia atrás (incluida la actual). Default 26. */
  weeks?: number;
}

const CELL = 14; // lado de cada celda (px)
const GAP = 4; // separación entre celdas (px)
const DIAS_LABEL = ['', 'Lun', '', 'Mié', '', 'Vie', '']; // domingo..sábado
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// Clave local de día (YYYY-M-D) — misma convención que asistenciaStore.
const claveDia = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Medianoche local de una fecha (copia; no muta el argumento).
const aMedianoche = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Suma días devolviendo una fecha NUEVA (inmutable).
const sumarDias = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ fechas, weeks = 26 }) => {
  const { colors } = useTheme();

  const { columnas, monthLabels, totalDias } = useMemo(() => {
    const hoy = aMedianoche(new Date());
    // Set de días con asistencia (clave local).
    const diasConGym = new Set(fechas.map((iso) => claveDia(new Date(iso))));

    // Domingo de la semana actual, luego retrocedemos (weeks-1) semanas para el inicio.
    const domingoActual = sumarDias(hoy, -hoy.getDay());
    const inicio = sumarDias(domingoActual, -(weeks - 1) * 7);

    const cols: { fecha: Date; asistio: boolean; futuro: boolean; esHoy: boolean }[][] = [];
    const labels: { col: number; texto: string }[] = [];
    let ultimoMes = -1;
    let total = 0;

    for (let w = 0; w < weeks; w++) {
      const semana: { fecha: Date; asistio: boolean; futuro: boolean; esHoy: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const fecha = sumarDias(inicio, w * 7 + d);
        const futuro = fecha.getTime() > hoy.getTime();
        const asistio = !futuro && diasConGym.has(claveDia(fecha));
        if (asistio) total++;
        semana.push({
          fecha,
          asistio,
          futuro,
          esHoy: fecha.getTime() === hoy.getTime(),
        });
      }
      // Etiqueta de mes: cuando la primera fila de la columna estrena mes.
      const primer = semana[0].fecha;
      if (primer.getMonth() !== ultimoMes) {
        ultimoMes = primer.getMonth();
        labels.push({ col: w, texto: MESES[primer.getMonth()] });
      }
      cols.push(semana);
    }

    return { columnas: cols, monthLabels: labels, totalDias: total };
  }, [fechas, weeks]);

  const colorCelda = (c: { asistio: boolean; futuro: boolean; esHoy: boolean }): string => {
    if (c.futuro) return 'transparent';
    if (c.asistio) return colors.accent;
    return colors.surfaceLight;
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Arranca mostrando lo más reciente (extremo derecho).
        contentOffset={{ x: weeks * (CELL + GAP), y: 0 }}
      >
        <View>
          {/* Fila de etiquetas de mes */}
          <View style={styles.monthRow}>
            {columnas.map((_, w) => {
              const label = monthLabels.find((m) => m.col === w);
              return (
                <View key={w} style={{ width: CELL + GAP }}>
                  {label ? (
                    <Text style={[styles.monthText, { color: colors.textMuted }]}>{label.texto}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.gridRow}>
            {/* Etiquetas de día a la izquierda */}
            <View style={styles.dayLabels}>
              {DIAS_LABEL.map((d, i) => (
                <View key={i} style={{ height: CELL + GAP, justifyContent: 'center' }}>
                  <Text style={[styles.dayText, { color: colors.textMuted }]}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Columnas de semanas */}
            {columnas.map((semana, w) => (
              <View key={w}>
                {semana.map((celda, d) => (
                  <View
                    key={d}
                    style={[
                      styles.cell,
                      {
                        backgroundColor: colorCelda(celda),
                        borderColor: celda.esHoy ? colors.accent : 'transparent',
                        borderWidth: celda.esHoy ? 1.5 : 0,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.legendRow}>
        <Text style={[styles.legendText, { color: colors.textSecondary }]}>
          {totalDias} {totalDias === 1 ? 'día' : 'días'} en el gym
        </Text>
        <View style={styles.legendScale}>
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Menos</Text>
          <View style={[styles.legendCell, { backgroundColor: colors.surfaceLight }]} />
          <View style={[styles.legendCell, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Más</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    marginLeft: 32, // ancho de la columna de etiquetas de día
    marginBottom: 4,
  },
  monthText: {
    fontFamily: fontFamily.medium,
    fontSize: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayLabels: {
    width: 32,
    justifyContent: 'flex-start',
  },
  dayText: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 3,
    marginRight: GAP,
    marginBottom: GAP,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  legendText: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
});

export default HabitHeatmap;
