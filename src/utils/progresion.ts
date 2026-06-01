import { LoadSuggestion } from '../types';

// ============================================================================
// Feature 5.4a — Progresión de cargas (heurística determinista, SIN IA).
//
// Util 100% PURO: no toca stores, no hace red, no tiene estado. Recibe todos los
// datos por parámetro (los extrae el caller desde workoutStore/recordsStore vía
// el hook useLoadSuggestion). Mismo input ⇒ misma salida (idempotente, cacheable
// por ejercicioId). Solo if/else, sin efectos secundarios.
//
// Regla (CONTRACT-fase5A §1.4). Evaluación en orden, primer match gana.
// ============================================================================

export interface ProgresionInput {
  ejercicioId: string;
  // Última aparición del ejercicio en historialWorkouts[0..] (la más reciente).
  // undefined si nunca se entrenó.
  ultimoEntreno?: {
    setsObjetivo: number;
    completado: boolean; // EjercicioWorkout.completado
    setsCompletados: { peso: number; reps: number; rpe?: number }[];
  };
  // PR histórico (recordsStore.personalRecords.get(ejercicioId)). undefined si no hay PR.
  pr?: { pesoActual: number };
  // Últimas N (3) apariciones del ejercicio para detectar fallos repetidos.
  // Orden: más reciente primero.
  historialReciente?: { completado: boolean }[];
}

// Redondeo a múltiplos de 0.25 kg (incrementos realistas de gimnasio).
const round025 = (x: number): number => Math.round(x * 4) / 4;

export function calcularSugerenciaCarga(input: ProgresionInput): LoadSuggestion {
  const { ultimoEntreno, pr, historialReciente } = input;

  // --- Caso 0: sin histórico (ni último entreno ni PR) ----------------------
  if (!ultimoEntreno && !pr) {
    return {
      pesoSugerido: 0,
      pesoBase: 0,
      cambio: 'mantener',
      deltaKg: 0,
      razon: 'Sin histórico',
      basadoEn: 'sin_datos',
    };
  }

  const setsCompletados = ultimoEntreno?.setsCompletados ?? [];

  // pesoBase = último set REALIZADO de la última sesión; si no hay, el PR; si no hay, 0.
  const ultimoSet = setsCompletados.length > 0 ? setsCompletados[setsCompletados.length - 1] : undefined;
  const pesoBase = ultimoSet?.peso ?? pr?.pesoActual ?? 0;

  // rpeProm = promedio de los rpe definidos; null si ninguno.
  const rpes = setsCompletados
    .map((s) => s.rpe)
    .filter((r): r is number => typeof r === 'number');
  const rpeProm = rpes.length > 0 ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;

  // completoSets = completado === true && setsCompletados.length >= setsObjetivo.
  const completoSets =
    ultimoEntreno?.completado === true &&
    setsCompletados.length >= (ultimoEntreno?.setsObjetivo ?? 0);

  // incremento = round025(max(2.5, pesoBase * 0.025)) con tope blando 5% si pesoBase>100.
  let incremento = Math.max(2.5, pesoBase * 0.025);
  if (pesoBase > 100) {
    incremento = Math.min(incremento, pesoBase * 0.05);
  }
  incremento = round025(incremento);

  const make = (
    cambio: LoadSuggestion['cambio'],
    pesoSugerido: number,
    razon: string,
    basadoEn: LoadSuggestion['basadoEn']
  ): LoadSuggestion => ({
    pesoSugerido,
    pesoBase,
    cambio,
    deltaKg: pesoSugerido - pesoBase, // siempre relativo a pesoBase
    razon,
    basadoEn,
  });

  // --- Caso 1: completó sus sets y RPE bajo (o sin RPE) → subir -------------
  if (completoSets && (rpeProm == null || rpeProm <= 7.5)) {
    const pesoSugerido = round025(pesoBase + incremento);
    const delta = round025(pesoSugerido - pesoBase);
    return make('subir', pesoSugerido, `RPE bajo, sube ${delta} kg`, 'ultimo_entreno');
  }

  // --- Caso 2: ≥2 de las últimas 3 apariciones con fallo → bajar ------------
  if (historialReciente && historialReciente.length > 0) {
    const fallos = historialReciente.slice(0, 3).filter((h) => h.completado === false).length;
    if (fallos >= 2) {
      const pesoSugerido = Math.max(0, round025(pesoBase - 2.5));
      return make('bajar', pesoSugerido, 'Varios fallos, baja 2.5 kg', 'fallo_multiple');
    }
  }

  // --- Caso 3: RPE alto → mantener ------------------------------------------
  if (ultimoEntreno && rpeProm != null && rpeProm >= 9) {
    return make('mantener', pesoBase, 'RPE alto, mantené la carga', 'ultimo_entreno');
  }

  // --- Caso 4: no completó los sets objetivo → mantener ---------------------
  if (ultimoEntreno && setsCompletados.length < ultimoEntreno.setsObjetivo) {
    return make('mantener', pesoBase, 'No completaste los sets, mantené', 'ultimo_entreno');
  }

  // --- Default: mantener ----------------------------------------------------
  return make(
    'mantener',
    pesoBase,
    'Mantené la carga',
    ultimoEntreno ? 'ultimo_entreno' : 'pr'
  );
}
