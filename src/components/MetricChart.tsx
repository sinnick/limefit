import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { fontFamily } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

// ============================================================================
// MetricChart (CONTRACT-fase1 1.3). Gráfico de línea SVG custom (sin libs nuevas,
// usa react-native-svg ya instalado, decisión §0). Self-contained: no depende de
// ProgressionChart (feature 1.2 paralela) para no acoplarse. Dibuja la evolución
// temporal de una serie de puntos { fecha, valor } ordenados ascendente por fecha.
// ============================================================================

export interface MetricChartPoint {
  fecha: string; // ISO
  valor: number;
}

interface MetricChartProps {
  data: MetricChartPoint[]; // puede venir desordenada; se ordena internamente
  suffix?: string; // p.ej. "kg", "%"
  height?: number;
}

const CHART_HEIGHT = 200;
const PADDING_X = 36;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 28;

export const MetricChart: React.FC<MetricChartProps> = ({
  data,
  suffix = '',
  height = CHART_HEIGHT,
}) => {
  const { colors } = useTheme();

  // Ancho fijo grande; el SVG escala con viewBox al ancho del contenedor.
  const width = 320;

  const puntos = useMemo(() => {
    const ordenados = [...data].sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    if (ordenados.length === 0) return [];

    const valores = ordenados.map((p) => p.valor);
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const rango = max - min || 1; // evita /0 cuando todos los valores son iguales

    const innerW = width - PADDING_X * 2;
    const innerH = height - PADDING_TOP - PADDING_BOTTOM;
    const n = ordenados.length;

    return ordenados.map((p, i) => {
      const x = n === 1 ? width / 2 : PADDING_X + (innerW * i) / (n - 1);
      const y = PADDING_TOP + innerH - ((p.valor - min) / rango) * innerH;
      return { ...p, x, y };
    });
  }, [data, height]);

  const escala = useMemo(() => {
    if (puntos.length === 0) return { min: 0, max: 0 };
    const valores = puntos.map((p) => p.valor);
    return { min: Math.min(...valores), max: Math.max(...valores) };
  }, [puntos]);

  if (puntos.length === 0) return null;

  // Path de la línea.
  const linePath = puntos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const primero = puntos[0];
  const ultimo = puntos[puntos.length - 1];

  return (
    <View style={styles.wrapper}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Líneas guía horizontales (min / max) */}
        <Line
          x1={PADDING_X}
          y1={PADDING_TOP}
          x2={width - PADDING_X}
          y2={PADDING_TOP}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <Line
          x1={PADDING_X}
          y1={height - PADDING_BOTTOM}
          x2={width - PADDING_X}
          y2={height - PADDING_BOTTOM}
          stroke={colors.border}
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Etiquetas de eje Y (max arriba, min abajo) */}
        <SvgText
          x={4}
          y={PADDING_TOP + 4}
          fontSize={10}
          fill={colors.textMuted}
        >
          {escala.max}
        </SvgText>
        <SvgText
          x={4}
          y={height - PADDING_BOTTOM + 4}
          fontSize={10}
          fill={colors.textMuted}
        >
          {escala.min}
        </SvgText>

        {/* Línea de la serie */}
        <Path
          d={linePath}
          stroke={colors.accent}
          strokeWidth={2.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Puntos */}
        {puntos.map((p, i) => (
          <Circle
            key={`${p.fecha}-${i}`}
            cx={p.x}
            cy={p.y}
            r={i === puntos.length - 1 ? 5 : 3.5}
            fill={colors.accent}
            stroke={colors.background}
            strokeWidth={1.5}
          />
        ))}

        {/* Fechas extremas en el eje X */}
        <SvgText
          x={primero.x}
          y={height - 8}
          fontSize={10}
          fill={colors.textMuted}
          textAnchor="start"
        >
          {fmtFecha(primero.fecha)}
        </SvgText>
        {puntos.length > 1 && (
          <SvgText
            x={ultimo.x}
            y={height - 8}
            fontSize={10}
            fill={colors.textMuted}
            textAnchor="end"
          >
            {fmtFecha(ultimo.fecha)}
          </SvgText>
        )}
      </Svg>

      {/* Resumen último valor */}
      <View style={styles.legend}>
        <Text style={[styles.legendValue, { color: colors.accent }]}>
          {ultimo.valor}
          {suffix ? ` ${suffix}` : ''}
        </Text>
        <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
          último registro
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 8,
  },
  legendValue: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
  },
  legendLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
  },
});

export default MetricChart;
