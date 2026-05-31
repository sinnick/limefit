import { WorkoutCompletado, Record, Racha, Logro, LogroId } from '../types';

// ============================================================================
// Rachas y logros (CONTRACT-fase1 §4.1 / 1.4). Funciones PURAS: se calculan en
// el cliente sobre workoutStore.historialWorkouts + recordsStore (sin backend).
// ============================================================================

// Normaliza una fecha ISO a la medianoche local en formato 'YYYY-MM-DD'.
const diaKey = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Diferencia en días-calendario entre dos claves 'YYYY-MM-DD' (b - a).
const difDias = (a: string, b: string): number => {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86_400_000);
};

// ----------------------------------------------------------------------------
// calcularRacha — racha de DÍAS consecutivos de entrenamiento.
//
// `actual`: días seguidos vigentes contando hacia atrás desde hoy (o desde ayer,
//   para no romper la racha si todavía no entrenó hoy). `mejor`: la racha más
//   larga del historial. Múltiples workouts en el mismo día cuentan como 1.
// ----------------------------------------------------------------------------
export const calcularRacha = (historial: WorkoutCompletado[]): Racha => {
  const base: Racha = { actual: 0, mejor: 0, ultimaFecha: undefined, unidad: 'dias' };
  if (!historial || historial.length === 0) return base;

  // Días únicos entrenados, ordenados ascendente.
  const dias = Array.from(new Set(historial.map((w) => diaKey(w.fecha)))).sort();
  if (dias.length === 0) return base;

  const ultimaFecha = historial
    .map((w) => w.fecha)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  // Mejor racha histórica: secuencias de días con diferencia exactamente 1.
  let mejor = 1;
  let run = 1;
  for (let i = 1; i < dias.length; i++) {
    if (difDias(dias[i - 1], dias[i]) === 1) {
      run += 1;
      if (run > mejor) mejor = run;
    } else {
      run = 1;
    }
  }

  // Racha actual: contar hacia atrás desde el último día entrenado SOLO si ese
  // último día es hoy o ayer (si no, la racha vigente es 0).
  const hoy = diaKey(new Date().toISOString());
  const ultimoDia = dias[dias.length - 1];
  const desfaseHoy = difDias(ultimoDia, hoy); // 0 = entrenó hoy, 1 = ayer
  let actual = 0;
  if (desfaseHoy <= 1) {
    actual = 1;
    for (let i = dias.length - 1; i > 0; i--) {
      if (difDias(dias[i - 1], dias[i]) === 1) actual += 1;
      else break;
    }
  }

  return { actual, mejor, ultimaFecha, unidad: 'dias' };
};

// ----------------------------------------------------------------------------
// calcularLogros — hitos desbloqueables sobre historial + records.
//
// Cada logro reporta `desbloqueado` y `progreso` (0..1) hacia su umbral. La
// `fechaDesbloqueo` se aproxima a la fecha del workout/PR que cruzó el umbral
// cuando es determinable; si no, se omite.
// ----------------------------------------------------------------------------

interface DefLogro {
  id: LogroId;
  titulo: string;
  descripcion: string;
  umbral: number;
  // métrica de la que depende: nº de entrenos, nº de PRs, o racha de días.
  metrica: 'entrenos' | 'prs' | 'racha';
}

const DEFS: DefLogro[] = [
  { id: 'primer_entreno', titulo: 'Primer paso', descripcion: 'Completá tu primer entrenamiento', umbral: 1, metrica: 'entrenos' },
  { id: 'entrenos_10', titulo: 'Constancia', descripcion: 'Completá 10 entrenamientos', umbral: 10, metrica: 'entrenos' },
  { id: 'entrenos_50', titulo: 'Disciplina', descripcion: 'Completá 50 entrenamientos', umbral: 50, metrica: 'entrenos' },
  { id: 'entrenos_100', titulo: 'Centurión', descripcion: 'Completá 100 entrenamientos', umbral: 100, metrica: 'entrenos' },
  { id: 'primer_pr', titulo: 'Récord', descripcion: 'Conseguí tu primer PR', umbral: 1, metrica: 'prs' },
  { id: 'prs_10', titulo: 'Imparable', descripcion: 'Conseguí 10 PRs', umbral: 10, metrica: 'prs' },
  { id: 'prs_25', titulo: 'Máquina', descripcion: 'Conseguí 25 PRs', umbral: 25, metrica: 'prs' },
  { id: 'racha_7', titulo: 'Semana perfecta', descripcion: 'Mantené una racha de 7 días', umbral: 7, metrica: 'racha' },
  { id: 'racha_30', titulo: 'Mentalidad de hierro', descripcion: 'Mantené una racha de 30 días', umbral: 30, metrica: 'racha' },
];

export const calcularLogros = (
  historial: WorkoutCompletado[],
  records: Record[]
): Logro[] => {
  const totalEntrenos = historial?.length ?? 0;

  // Nº de PRs: records marcados como esRecord; si ninguno trae el flag (datos
  // viejos), cae al total de records como aproximación conservadora.
  const recs = records ?? [];
  const prsFlag = recs.filter((r) => r.esRecord).length;
  const totalPrs = prsFlag > 0 ? prsFlag : recs.length;

  const { mejor: mejorRacha } = calcularRacha(historial ?? []);

  const valorDe = (metrica: DefLogro['metrica']): number => {
    if (metrica === 'entrenos') return totalEntrenos;
    if (metrica === 'prs') return totalPrs;
    return mejorRacha;
  };

  // Para fechaDesbloqueo de entrenos: fecha del n-ésimo workout (orden cronológico asc).
  const entrenosAsc = [...(historial ?? [])].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  return DEFS.map((def) => {
    const valor = valorDe(def.metrica);
    const desbloqueado = valor >= def.umbral;
    const progreso = Math.max(0, Math.min(1, valor / def.umbral));

    let fechaDesbloqueo: string | undefined;
    if (desbloqueado && def.metrica === 'entrenos' && entrenosAsc[def.umbral - 1]) {
      fechaDesbloqueo = entrenosAsc[def.umbral - 1].fecha;
    }

    return {
      id: def.id,
      titulo: def.titulo,
      descripcion: def.descripcion,
      desbloqueado,
      fechaDesbloqueo,
      progreso,
    };
  });
};
