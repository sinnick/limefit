import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { syncQueue } from '../services/syncQueue';
import { useUserStore } from './userStore';
import { Asistencia, MetodoCheckin } from '../types';

// ============================================================================
// Store de asistencia / check-in (CONTRACT-fase2 §2.5 / §5.5). Offline-first:
// `marcarAsistencia` guarda local (MMKV) e inmediatamente encola para subir
// (syncQueue.enqueueAsistencia → type 'asistencia'). La verdad local vive acá;
// `setAsistencias` la reemplaza con lo que llega del backend (list), conservando
// los check-ins locales aún no subidos. El backend colapsa por
// (GYM_ID, DNI, FECHA-día), así que reintentos del mismo día son no-op.
// ============================================================================

interface AsistenciaState {
  historial: Asistencia[];
  setAsistencias: (asistencias: Asistencia[]) => void;
  // Alta local + encolar. Devuelve la Asistencia creada (o la del día si ya existe).
  marcarAsistencia: (input?: {
    metodo?: MetodoCheckin;
    notas?: string;
    dni?: string;
    fecha?: string;
  }) => Asistencia;
  // ¿Ya hay un check-in para HOY (mismo día local)? Evita escaneos repetidos.
  yaRegistradoHoy: () => boolean;
}

const generarId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// DNI del socio logueado (fuente de verdad = userStore), igual que la syncQueue.
const currentDni = (): string => useUserStore.getState().user?.DNI ?? '';

// Clave de día local (YYYY-MM-DD) para detectar duplicados del mismo día en la UI.
// El backend usa medianoche UTC; acá basta una comparación local para el guardarraíl.
const claveDia = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

const ordenarPorFecha = (items: Asistencia[]): Asistencia[] =>
  [...items].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

export const useAsistenciaStore = create<AsistenciaState>()(
  persist(
    (set, get) => ({
      historial: [],

      // Reemplaza el historial local con lo del backend (list), pero conserva los
      // check-ins locales pendientes que el backend todavía no devolvió (mismo
      // clientId/id) para no perder asistencias offline aún sin subir.
      setAsistencias: (asistencias) =>
        set((state) => {
          const fromBackend = new Map(
            asistencias.map((a) => [a.clientId ?? a.id, a] as const)
          );
          const pendientesLocales = state.historial.filter(
            (a) => !fromBackend.has(a.clientId ?? a.id)
          );
          return { historial: ordenarPorFecha([...asistencias, ...pendientesLocales]) };
        }),

      // Alta local + encolar (offline-first, CONTRACT c.3). El id local es la clave
      // de idempotencia (clientId = id). Si ya existe un check-in local de HOY,
      // se devuelve ese mismo (no se crea otro): un check-in por día.
      marcarAsistencia: (input) => {
        const dni = input?.dni || currentDni();
        const ahora = new Date().toISOString();
        const fecha = input?.fecha || ahora;

        const existenteHoy = get().historial.find(
          (a) => a.dni === dni && claveDia(a.fecha) === claveDia(fecha)
        );
        if (existenteHoy) return existenteHoy;

        const id = generarId();
        const nueva: Asistencia = {
          id,
          clientId: id,
          dni,
          fecha,
          horaCheckin: ahora,
          metodo: input?.metodo ?? 'qr',
          notas: input?.notas,
        };

        set((state) => ({
          historial: ordenarPorFecha([
            nueva,
            ...state.historial.filter(
              (a) => (a.clientId ?? a.id) !== (nueva.clientId ?? nueva.id)
            ),
          ]),
        }));

        // Offline-first: tras guardar local, encolar para subir. Síncrono; no
        // bloquea la UI. El flush sube cuando hay red (o reintenta con backoff).
        syncQueue.enqueueAsistencia(nueva);

        return nueva;
      },

      yaRegistradoHoy: () => {
        const dni = currentDni();
        const hoy = claveDia(new Date().toISOString());
        return get().historial.some(
          (a) => a.dni === dni && claveDia(a.fecha) === hoy
        );
      },
    }),
    {
      name: 'limefit-asistencia-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ historial: state.historial }),
    }
  )
);

// Selectores
export const useAsistenciaHistorial = () =>
  useAsistenciaStore((state) => state.historial);
