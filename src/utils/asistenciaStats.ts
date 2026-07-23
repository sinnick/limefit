// ============================================================================
// Estadísticas de asistencia (días que el socio fue al gym). Funciones PURAS
// sobre fechas ISO — la fuente es asistenciaStore.historial.
//
// Toda la aritmética de fechas es INMUTABLE: nunca `setDate` sobre una fecha
// compartida (ese patrón ya causó un bug de mutación en InicioScreen).
// `achievements.ts` hace lo propio para workouts; acá el insumo son asistencias.
// ============================================================================

export interface RachaAsistencia {
  /** Días consecutivos vigentes (cuenta desde hoy, o desde ayer si hoy no marcó). */
  actual: number;
  /** Racha más larga del historial. */
  mejor: number;
}

/** Clave de día local 'YYYY-MM-DD' (misma convención que asistenciaStore). */
export const diaKey = (iso: string): string => {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

/** Diferencia en días-calendario entre dos claves 'YYYY-MM-DD' (b - a). */
const difDias = (a: string, b: string): number =>
  Math.round(
    (new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86_400_000
  );

/**
 * Racha de días consecutivos de asistencia. Varias asistencias el mismo día
 * cuentan como una. La racha vigente no se rompe si todavía no marcó HOY
 * (se permite que el último día sea ayer).
 */
export const calcularRachaAsistencia = (fechas: string[]): RachaAsistencia => {
  if (!fechas || fechas.length === 0) return { actual: 0, mejor: 0 };

  const dias = Array.from(new Set(fechas.map(diaKey))).sort();

  // Mejor racha histórica: corridas de días con diferencia exactamente 1.
  let mejor = 1;
  let run = 1;
  for (let i = 1; i < dias.length; i++) {
    run = difDias(dias[i - 1], dias[i]) === 1 ? run + 1 : 1;
    if (run > mejor) mejor = run;
  }

  // Racha vigente: hacia atrás desde el último día registrado, siempre que ese
  // último día sea hoy o ayer (si es más viejo, la racha está cortada).
  const hoy = new Date();
  const hoyKey = diaKey(hoy.toISOString());
  const ultimo = dias[dias.length - 1];
  const distanciaAHoy = difDias(ultimo, hoyKey);

  let actual = 0;
  if (distanciaAHoy === 0 || distanciaAHoy === 1) {
    actual = 1;
    for (let i = dias.length - 1; i > 0; i--) {
      if (difDias(dias[i - 1], dias[i]) === 1) actual += 1;
      else break;
    }
  }

  return { actual, mejor };
};

/**
 * Los 7 días de la semana en curso (lunes→domingo) con si hubo asistencia.
 * Alimenta la barra de ticks del hero.
 */
export interface DiaSemana {
  inicial: string;
  asistio: boolean;
  esHoy: boolean;
  futuro: boolean;
}

const INICIALES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const semanaActual = (fechas: string[]): DiaSemana[] => {
  const set = new Set(fechas.map(diaKey));
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  // getDay(): 0=domingo. Convertimos a índice lunes=0.
  const idxLunes = (hoy.getDay() + 6) % 7;

  return INICIALES.map((inicial, i) => {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - idxLunes + i);
    const key = diaKey(fecha.toISOString());
    return {
      inicial,
      asistio: set.has(key),
      esHoy: i === idxLunes,
      futuro: fecha.getTime() > hoy.getTime(),
    };
  });
};

/** Cantidad de días distintos con asistencia (para el contador del heatmap). */
export const totalDias = (fechas: string[]): number =>
  new Set(fechas.map(diaKey)).size;
