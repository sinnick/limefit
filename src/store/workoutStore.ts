import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import {
  WorkoutActivo,
  WorkoutCompletado,
  EjercicioWorkout,
  SetCompletado,
  Rutina,
  DiaRutina,
} from '../types';

interface WorkoutState {
  workoutActivo: WorkoutActivo | null;
  historialWorkouts: WorkoutCompletado[];
  tiempoDescanso: number;
  tiempoRestante: number;
  enDescanso: boolean;

  // Workout Actions
  iniciarWorkout: (rutina: Rutina, dia: DiaRutina) => void;
  pausarWorkout: () => void;
  reanudarWorkout: () => void;
  finalizarWorkout: () => WorkoutCompletado | null;
  cancelarWorkout: () => void;

  // Ejercicio Actions
  siguienteEjercicio: () => void;
  anteriorEjercicio: () => void;
  irAEjercicio: (index: number) => void;

  // Set Actions
  completarSet: (ejercicioIndex: number, set: SetCompletado) => void;
  actualizarSet: (ejercicioIndex: number, setIndex: number, updates: Partial<SetCompletado>) => void;

  // Timer Actions
  iniciarDescanso: (tiempo?: number) => void;
  pausarDescanso: () => void;
  finalizarDescanso: () => void;
  setTiempoRestante: (tiempo: number) => void;

  // Historial Actions
  addWorkoutHistorial: (workout: WorkoutCompletado) => void;
  clearHistorial: () => void;
}

const generarId = () => Math.random().toString(36).substring(2, 9);

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      workoutActivo: null,
      historialWorkouts: [],
      tiempoDescanso: 90,
      tiempoRestante: 0,
      enDescanso: false,

      iniciarWorkout: (rutina, dia) => {
        const ejercicios: EjercicioWorkout[] = dia.ejercicios.map((e) => ({
          id: generarId(),
          ejercicioId: e.id || e.ejercicioId,
          nombre: e.nombre,
          setsObjetivo: e.sets,
          repsObjetivo: e.reps,
          pesoObjetivo: e.peso,
          setsCompletados: [],
          completado: false,
        }));

        const workout: WorkoutActivo = {
          id: generarId(),
          rutinaId: rutina.id || rutina._id || '',
          rutinaNombre: rutina.nombre,
          diaId: dia.id,
          diaNombre: dia.nombre,
          fechaInicio: new Date().toISOString(),
          ejercicios,
          ejercicioActualIndex: 0,
          tiempoTotal: 0,
          estado: 'activo',
        };

        set({ workoutActivo: workout });
      },

      pausarWorkout: () =>
        set((state) => ({
          workoutActivo: state.workoutActivo
            ? { ...state.workoutActivo, estado: 'pausado' }
            : null,
        })),

      reanudarWorkout: () =>
        set((state) => ({
          workoutActivo: state.workoutActivo
            ? { ...state.workoutActivo, estado: 'activo' }
            : null,
        })),

      finalizarWorkout: () => {
        const { workoutActivo, addWorkoutHistorial } = get();
        if (!workoutActivo) return null;

        const volumenTotal = workoutActivo.ejercicios.reduce((total, ejercicio) => {
          return (
            total +
            ejercicio.setsCompletados.reduce((setTotal, set) => {
              return setTotal + set.peso * set.reps;
            }, 0)
          );
        }, 0);

        const prsLogrados = workoutActivo.ejercicios.reduce((total, ejercicio) => {
          return (
            total +
            ejercicio.setsCompletados.filter((set) => set.esRecord).length
          );
        }, 0);

        const duracion = Math.round(
          (Date.now() - new Date(workoutActivo.fechaInicio).getTime()) / 60000
        );

        const workoutCompletado: WorkoutCompletado = {
          id: workoutActivo.id,
          rutinaId: workoutActivo.rutinaId,
          rutinaNombre: workoutActivo.rutinaNombre,
          diaId: workoutActivo.diaId,
          diaNombre: workoutActivo.diaNombre,
          fecha: new Date().toISOString(),
          duracion,
          ejercicios: workoutActivo.ejercicios,
          volumenTotal,
          prsLogrados,
        };

        addWorkoutHistorial(workoutCompletado);
        set({ workoutActivo: null });

        return workoutCompletado;
      },

      cancelarWorkout: () => set({ workoutActivo: null, enDescanso: false, tiempoRestante: 0 }),

      siguienteEjercicio: () =>
        set((state) => {
          if (!state.workoutActivo) return state;
          const newIndex = Math.min(
            state.workoutActivo.ejercicioActualIndex + 1,
            state.workoutActivo.ejercicios.length - 1
          );
          return {
            workoutActivo: {
              ...state.workoutActivo,
              ejercicioActualIndex: newIndex,
            },
          };
        }),

      anteriorEjercicio: () =>
        set((state) => {
          if (!state.workoutActivo) return state;
          const newIndex = Math.max(state.workoutActivo.ejercicioActualIndex - 1, 0);
          return {
            workoutActivo: {
              ...state.workoutActivo,
              ejercicioActualIndex: newIndex,
            },
          };
        }),

      irAEjercicio: (index) =>
        set((state) => {
          if (!state.workoutActivo) return state;
          const clampedIndex = Math.max(
            0,
            Math.min(index, state.workoutActivo.ejercicios.length - 1)
          );
          return {
            workoutActivo: {
              ...state.workoutActivo,
              ejercicioActualIndex: clampedIndex,
            },
          };
        }),

      completarSet: (ejercicioIndex, nuevoSet) =>
        set((state) => {
          if (!state.workoutActivo) return state;

          const ejercicios = [...state.workoutActivo.ejercicios];
          const ejercicio = { ...ejercicios[ejercicioIndex] };
          ejercicio.setsCompletados = [...ejercicio.setsCompletados, nuevoSet];

          // Marcar como completado si se alcanzaron todos los sets
          if (ejercicio.setsCompletados.length >= ejercicio.setsObjetivo) {
            ejercicio.completado = true;
          }

          ejercicios[ejercicioIndex] = ejercicio;

          return {
            workoutActivo: {
              ...state.workoutActivo,
              ejercicios,
            },
          };
        }),

      actualizarSet: (ejercicioIndex, setIndex, updates) =>
        set((state) => {
          if (!state.workoutActivo) return state;

          const ejercicios = [...state.workoutActivo.ejercicios];
          const ejercicio = { ...ejercicios[ejercicioIndex] };
          const setsCompletados = [...ejercicio.setsCompletados];
          setsCompletados[setIndex] = { ...setsCompletados[setIndex], ...updates };
          ejercicio.setsCompletados = setsCompletados;
          ejercicios[ejercicioIndex] = ejercicio;

          return {
            workoutActivo: {
              ...state.workoutActivo,
              ejercicios,
            },
          };
        }),

      iniciarDescanso: (tiempo) =>
        set((state) => ({
          enDescanso: true,
          tiempoRestante: tiempo ?? state.tiempoDescanso,
        })),

      pausarDescanso: () => set({ enDescanso: false }),

      finalizarDescanso: () => set({ enDescanso: false, tiempoRestante: 0 }),

      setTiempoRestante: (tiempo) => set({ tiempoRestante: tiempo }),

      addWorkoutHistorial: (workout) =>
        set((state) => ({
          historialWorkouts: [workout, ...state.historialWorkouts].slice(0, 100), // Guardar últimos 100
        })),

      clearHistorial: () => set({ historialWorkouts: [] }),
    }),
    {
      name: 'limefit-workout-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        historialWorkouts: state.historialWorkouts,
        tiempoDescanso: state.tiempoDescanso,
      }),
    }
  )
);

// Selectores
export const useWorkoutActivo = () => useWorkoutStore((state) => state.workoutActivo);
export const useHistorialWorkouts = () => useWorkoutStore((state) => state.historialWorkouts);
export const useEjercicioActual = () => {
  const workout = useWorkoutStore((state) => state.workoutActivo);
  if (!workout) return null;
  return workout.ejercicios[workout.ejercicioActualIndex];
};
