import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { Rutina, DiaRutina, EjercicioEnRutina } from '../types';

interface RutinasState {
  rutinas: Rutina[];
  rutinaActiva: Rutina | null;
  diaActivo: DiaRutina | null;
  isLoading: boolean;

  // Actions
  setRutinas: (rutinas: Rutina[]) => void;
  clearRutinas: () => void;
  addRutina: (rutina: Rutina) => void;
  updateRutina: (rutinaId: string, updates: Partial<Rutina>) => void;
  deleteRutina: (rutinaId: string) => void;
  setRutinaActiva: (rutina: Rutina | null) => void;
  setDiaActivo: (dia: DiaRutina | null) => void;
  setLoading: (loading: boolean) => void;

  // Ejercicios actions
  addEjercicio: (rutinaId: string, diaId: string, ejercicio: EjercicioEnRutina) => void;
  updateEjercicio: (
    rutinaId: string,
    diaId: string,
    ejercicioId: string,
    updates: Partial<EjercicioEnRutina>
  ) => void;
  deleteEjercicio: (rutinaId: string, diaId: string, ejercicioId: string) => void;
  reorderEjercicios: (rutinaId: string, diaId: string, ejercicios: EjercicioEnRutina[]) => void;
}

export const useRutinasStore = create<RutinasState>()(
  persist(
    (set, get) => ({
      rutinas: [],
      rutinaActiva: null,
      diaActivo: null,
      isLoading: false,

      // El store guarda SOLO las rutinas ASIGNADAS al socio (CONTRACT b.2),
      // que llegan vía rutinasApi.getMisRutinasAsignadas(dni) (ver useRutinasQuery).
      setRutinas: (rutinas) => set({ rutinas }),

      // Limpia las rutinas asignadas cacheadas en MMKV. Necesario al desloguear o
      // cambiar de socio para no mostrar las rutinas del socio anterior.
      clearRutinas: () => set({ rutinas: [], rutinaActiva: null, diaActivo: null }),

      addRutina: (rutina) =>
        set((state) => ({
          rutinas: [...state.rutinas, rutina],
        })),

      updateRutina: (rutinaId, updates) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) =>
            (r.id === rutinaId || r._id === rutinaId) ? { ...r, ...updates } : r
          ),
        })),

      deleteRutina: (rutinaId) =>
        set((state) => ({
          rutinas: state.rutinas.filter((r) => r.id !== rutinaId && r._id !== rutinaId),
        })),

      setRutinaActiva: (rutina) => set({ rutinaActiva: rutina }),

      setDiaActivo: (dia) => set({ diaActivo: dia }),

      setLoading: (isLoading) => set({ isLoading }),

      addEjercicio: (rutinaId, diaId, ejercicio) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) => {
            if (r.id !== rutinaId && r._id !== rutinaId) return r;
            return {
              ...r,
              dias: r.dias.map((d) =>
                d.id === diaId
                  ? { ...d, ejercicios: [...d.ejercicios, ejercicio] }
                  : d
              ),
            };
          }),
        })),

      updateEjercicio: (rutinaId, diaId, ejercicioId, updates) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) => {
            if (r.id !== rutinaId && r._id !== rutinaId) return r;
            return {
              ...r,
              dias: r.dias.map((d) => {
                if (d.id !== diaId) return d;
                return {
                  ...d,
                  ejercicios: d.ejercicios.map((e) =>
                    e.id === ejercicioId ? { ...e, ...updates } : e
                  ),
                };
              }),
            };
          }),
        })),

      deleteEjercicio: (rutinaId, diaId, ejercicioId) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) => {
            if (r.id !== rutinaId && r._id !== rutinaId) return r;
            return {
              ...r,
              dias: r.dias.map((d) => {
                if (d.id !== diaId) return d;
                return {
                  ...d,
                  ejercicios: d.ejercicios.filter((e) => e.id !== ejercicioId),
                };
              }),
            };
          }),
        })),

      reorderEjercicios: (rutinaId, diaId, ejercicios) =>
        set((state) => ({
          rutinas: state.rutinas.map((r) => {
            if (r.id !== rutinaId && r._id !== rutinaId) return r;
            return {
              ...r,
              dias: r.dias.map((d) =>
                d.id === diaId ? { ...d, ejercicios } : d
              ),
            };
          }),
        })),
    }),
    {
      name: 'limefit-rutinas-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        rutinas: state.rutinas,
      }),
    }
  )
);

// Selectores
export const useRutinas = () => useRutinasStore((state) => state.rutinas);
export const useRutinaActiva = () => useRutinasStore((state) => state.rutinaActiva);
export const useDiaActivo = () => useRutinasStore((state) => state.diaActivo);
export const useClearRutinas = () => useRutinasStore((state) => state.clearRutinas);
