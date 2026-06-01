import { useMemo } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { useRecordsStore } from '../store/recordsStore';
import { calcularSugerenciaCarga, ProgresionInput } from '../utils/progresion';
import { LoadSuggestion } from '../types';

// ============================================================================
// Hook fino (CONTRACT-fase5A §1.6). Es el ÚNICO punto que toca los stores para
// armar el ProgresionInput; el util `calcularSugerenciaCarga` sigue 100% puro.
//
// Lee historialWorkouts (workoutStore) + personalRecords (recordsStore), arma la
// entrada (última aparición del ejercicio + historialReciente + PR) y memoiza la
// salida por ejercicioId. Sin red, sin efectos.
// ============================================================================

export function useLoadSuggestion(ejercicioId: string): LoadSuggestion {
  const historialWorkouts = useWorkoutStore((s) => s.historialWorkouts);
  const personalRecords = useRecordsStore((s) => s.personalRecords);

  return useMemo(() => {
    // Apariciones de este ejercicio en el historial (orden: más reciente primero,
    // tal cual lo guarda finalizarWorkout: [workout, ...historial]).
    const apariciones = historialWorkouts
      .map((w) => w.ejercicios.find((e) => e.ejercicioId === ejercicioId))
      .filter((e): e is NonNullable<typeof e> => !!e);

    const ultima = apariciones[0];
    const pr = personalRecords.get(ejercicioId);

    const input: ProgresionInput = {
      ejercicioId,
      ultimoEntreno: ultima
        ? {
            setsObjetivo: ultima.setsObjetivo,
            completado: ultima.completado,
            setsCompletados: ultima.setsCompletados.map((s) => ({
              peso: s.peso,
              reps: s.reps,
              rpe: s.rpe,
            })),
          }
        : undefined,
      pr: pr ? { pesoActual: pr.pesoActual } : undefined,
      historialReciente: apariciones.slice(0, 3).map((e) => ({ completado: e.completado })),
    };

    return calcularSugerenciaCarga(input);
  }, [ejercicioId, historialWorkouts, personalRecords]);
}
