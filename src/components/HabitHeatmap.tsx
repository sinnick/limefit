import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';
import { diaKey } from '../utils/asistenciaStats';

// ============================================================================
// HabitHeatmap — grilla de constancia estilo "commit graph" de GitHub.
//
// Decisiones de diseño (ui-taste):
//  · 13 semanas (un trimestre) que ENTRAN en pantalla — sin scroll horizontal.
//    26 semanas con scroll se leían como un rectángulo gris muerto.
//  · Celda dimensionada al ancho disponible, radius 8 (nada de 2-3px).
//  · El día de HOY lleva anillo; TODAS las celdas reservan el borde en
//    transparente para que marcar asistencia no cambie dimensiones.
//  · Aritmética de fechas inmutable (nunca `setDate` sobre fecha compartida).
// ============================================================================

interface HabitHeatmapProps {
  /** Fechas ISO en las que hubo asistencia (repetidas del mismo día dan igual). */
  fechas: string[];
  /** Semanas hacia atrás a mostrar, incluida la actual. */
  weeks?: number;
}

const GAP = 4;
const RING = 2; // borde reservado en todas las celdas
const LABEL_W = 24; // columna de iniciales de día
const SCREEN_PAD = 20; // padding lateral de la pantalla
const CARD_PAD = 16; // padding interno del contenedor

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
// Domingo arriba, como GitHub. Solo se rotulan lun/mié/vie para no saturar.
const DIAS_LABEL = ['', 'L', '', 'M', '', 'V', ''];

const sumarDias = (d: Date, n: number): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ fechas, weeks = 13 }) => {
  const { colors } = useTheme();

  // Celda calculada para que las `weeks` columnas entren sin scroll.
  const cell = useMemo(() => {
    const disponible =
      Dimensions.get('window').width - SCREEN_PAD * 2 - CARD_PAD * 2 - LABEL_W;
    return Math.floor((disponible - (weeks - 1) * GAP) / weeks);
  }, [weeks]);

  const { columnas, monthLabels, total } = useMemo(() => {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const dias = new Set(fechas.map(diaKey));

    const domingoActual = sumarDias(hoy, -hoy.getDay());
    const inicio = sumarDias(domingoActual, -(weeks - 1) * 7);

    const cols: { asistio: boolean; futuro: boolean; esHoy: boolean }[][] = [];
    const labels: { col: number; texto: string }[] = [];
    let ultimoMes = -1;

    for (let w = 0; w < weeks; w++) {
      const semana = [];
      for (let d = 0; d < 7; d++) {
        const fecha = sumarDias(inicio, w * 7 + d);
        const futuro = fecha.getTime() > hoy.getTime();
        semana.push({
          asistio: !futuro && dias.has(diaKey(fecha.toISOString())),
          futuro,
          esHoy: fecha.getTime() === hoy.getTime(),
        });
      }
      const primer = sumarDias(inicio, w * 7);
      if (primer.getMonth() !== ultimoMes) {
        ultimoMes = primer.getMonth();
        labels.push({ col: w, texto: MESES[primer.getMonth()] });
      }
      cols.push(semana);
    }

    return { columnas: cols, monthLabels: labels, total: dias.size };
  }, [fechas, weeks]);

  const step = cell + GAP;

  return (
    <View>
      {/* Etiquetas de mes */}
      <View style={[styles.monthRow, { marginLeft: LABEL_W }]}>
        {columnas.map((_, w) => {
          const label = monthLabels.find((m) => m.col === w);
          return (
            <View key={w} style={{ width: step }}>
              {label ? (
                <Text style={[styles.monthText, { color: colors.textMuted }]}>{label.texto}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <View style={styles.gridRow}>
        <View style={{ width: LABEL_W }}>
          {DIAS_LABEL.map((d, i) => (
            <View key={i} style={{ height: step, justifyContent: 'center' }}>
              <Text style={[styles.dayText, { color: colors.textMuted }]}>{d}</Text>
            </View>
          ))}
        </View>

        {columnas.map((semana, w) => (
          <View key={w}>
            {semana.map((c, d) => (
              <View
                key={d}
                style={[
                  styles.cell,
                  {
                    width: cell,
                    height: cell,
                    marginRight: GAP,
                    marginBottom: GAP,
                    backgroundColor: c.futuro
                      ? 'transparent'
                      : c.asistio
                        ? colors.accent
                        : colors.surfaceLight,
                    // Borde SIEMPRE presente (transparente salvo hoy): marcar
                    // asistencia no debe cambiar las dimensiones de la celda.
                    borderColor: c.esHoy
                      ? c.asistio
                        ? colors.accentLight
                        : colors.accent
                      : 'transparent',
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {total === 0 ? (
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Marcá tu primer día y arrancá la racha.
          </Text>
        ) : (
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {total} {total === 1 ? 'día' : 'días'} en los últimos 3 meses
          </Text>
        )}
        <View style={styles.legend}>
          <View
            style={[styles.legendCell, { backgroundColor: colors.surfaceLight }]}
          />
          <View style={[styles.legendCell, { backgroundColor: colors.accent }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  monthRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
  },
  dayText: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
  },
  cell: {
    borderRadius: 8,
    borderWidth: RING,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  footerText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 8,
  },
});

export default HabitHeatmap;
