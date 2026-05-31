import React, { useMemo } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { fontFamily } from '../constants/theme';

// ============================================================================
// ProgressionChart (CONTRACT-fase1 §4.2 / 1.2).
//
// Gráfico de línea SVG custom (react-native-svg, ya instalado — NO victory/
// chart-kit). Dibuja una serie temporal (peso o volumen vs tiempo) con eje X
// implícito por orden cronológico, ejes/grilla básicos y puntos. Los puntos
// marcados como `highlight` (p.ej. PRs) se resaltan con el accent de marca.
//
// Reutilizable por 1.3 (MetricChart puede envolver/usar este componente).
// ============================================================================

export interface ProgressionPoint {
  fecha: string; // ISO
  valor: number;
  highlight?: boolean; // p.ej. es un PR
}

interface ProgressionChartProps {
  data: ProgressionPoint[];
  // Sufijo de unidad para etiquetas del eje Y (p.ej. "kg", "lb", "vol").
  unidad?: string;
  height?: number;
  // Color de la línea/relleno. Default: accent del tema.
  color?: string;
}

const CHART_PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const POINT_RADIUS = 3.5;
const HIGHLIGHT_RADIUS = 5;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

const formatValue = (v: number) =>
  Number.isInteger(v) ? String(v) : v.toFixed(1);

export const ProgressionChart: React.FC<ProgressionChartProps> = ({
  data,
  unidad = '',
  height = 220,
  color,
}) => {
  const { colors } = useTheme();
  const lineColor = color ?? colors.accent;
  const [width, setWidth] = React.useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== width) setWidth(w);
  };

  // Ordenar cronológicamente por fecha (defensivo: no asumir orden de entrada).
  const points = useMemo(
    () =>
      [...data].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      ),
    [data]
  );

  const { min, max } = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 0 };
    const valores = points.map((p) => p.valor);
    let mn = Math.min(...valores);
    let mx = Math.max(...valores);
    if (mn === mx) {
      // Serie plana: dar algo de margen para que la línea no quede pegada al borde.
      mn = mn - 1;
      mx = mx + 1;
    }
    return { min: mn, max: mx };
  }, [points]);

  const plotWidth = Math.max(0, width - CHART_PADDING.left - CHART_PADDING.right);
  const plotHeight = Math.max(0, height - CHART_PADDING.top - CHART_PADDING.bottom);

  // Coordenadas en el espacio del SVG.
  const coords = useMemo(() => {
    if (points.length === 0 || plotWidth <= 0) return [];
    const range = max - min || 1;
    const stepX =
      points.length > 1 ? plotWidth / (points.length - 1) : 0;
    return points.map((p, i) => {
      const x =
        CHART_PADDING.left +
        (points.length > 1 ? stepX * i : plotWidth / 2);
      const y =
        CHART_PADDING.top +
        plotHeight -
        ((p.valor - min) / range) * plotHeight;
      return { x, y, point: p };
    });
  }, [points, plotWidth, plotHeight, min, max]);

  const linePath = useMemo(() => {
    if (coords.length === 0) return '';
    return coords
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
      .join(' ');
  }, [coords]);

  // Path de relleno (área bajo la línea) hasta la base del plot.
  const areaPath = useMemo(() => {
    if (coords.length === 0) return '';
    const baseY = CHART_PADDING.top + plotHeight;
    const first = coords[0];
    const last = coords[coords.length - 1];
    return (
      `${linePath} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} ` +
      `L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`
    );
  }, [coords, linePath, plotHeight]);

  // Etiquetas del eje Y (min, mid, max).
  const yTicks = useMemo(() => {
    const mid = (min + max) / 2;
    return [max, mid, min];
  }, [min, max]);

  if (points.length === 0) {
    return (
      <View style={[styles.empty, { height }]} onLayout={onLayout}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Sin datos para graficar
        </Text>
      </View>
    );
  }

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {/* Grilla horizontal + etiquetas eje Y */}
          {yTicks.map((tick, i) => {
            const y =
              CHART_PADDING.top + (plotHeight / (yTicks.length - 1)) * i;
            return (
              <React.Fragment key={`grid-${i}`}>
                <Line
                  x1={CHART_PADDING.left}
                  y1={y}
                  x2={width - CHART_PADDING.right}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <SvgText
                  x={CHART_PADDING.left - 6}
                  y={y + 4}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="end"
                >
                  {formatValue(tick)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Área bajo la curva */}
          <Path d={areaPath} fill={lineColor} fillOpacity={0.12} />

          {/* Línea principal */}
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Puntos */}
          {coords.map((c, i) => (
            <Circle
              key={`pt-${i}`}
              cx={c.x}
              cy={c.y}
              r={c.point.highlight ? HIGHLIGHT_RADIUS : POINT_RADIUS}
              fill={c.point.highlight ? '#FFD700' : lineColor}
              stroke={colors.background}
              strokeWidth={1.5}
            />
          ))}

          {/* Etiquetas eje X (primera y última fecha) */}
          {coords.length > 0 && (
            <>
              <SvgText
                x={coords[0].x}
                y={height - 8}
                fontSize={10}
                fill={colors.textMuted}
                textAnchor="start"
              >
                {formatDate(coords[0].point.fecha)}
              </SvgText>
              {coords.length > 1 && (
                <SvgText
                  x={coords[coords.length - 1].x}
                  y={height - 8}
                  fontSize={10}
                  fill={colors.textMuted}
                  textAnchor="end"
                >
                  {formatDate(coords[coords.length - 1].point.fecha)}
                </SvgText>
              )}
            </>
          )}
        </Svg>
      )}

      {unidad ? (
        <Text style={[styles.unidadLabel, { color: colors.textMuted }]}>
          {unidad}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
  },
  unidadLabel: {
    position: 'absolute',
    top: 0,
    left: 4,
    fontFamily: fontFamily.regular,
    fontSize: 10,
  },
});

export default ProgressionChart;
