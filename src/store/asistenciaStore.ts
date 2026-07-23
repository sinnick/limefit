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
  // Deshacer el check-in de un día (por defecto hoy). Quita local + sincroniza la
  // baja. Devuelve true si había algo que deshacer.
  desmarcarAsistencia: (input?: { dni?: string; fecha?: string }) => boolean;
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

      // Deshacer el check-in de un día. Offline-first y sin races:
      //   1. Quita la asistencia del historial local (verdad local).
      //   2. Intenta CANCELAR el check-in aún pendiente en la cola: si nunca se
      //      subió, alcanza con eso (no hay nada que borrar en el backend).
      //   3. Si el check-in ya se había subido (o ya no estaba pendiente), encola
      //      una BAJA para que el backend lo borre (unCheckIn, idempotente).
      desmarcarAsistencia: (input) => {
        const dni = input?.dni || currentDni();
        const clave = claveDia(input?.fecha || new Date().toISOString());

        const asistencia = get().historial.find(
          (a) => a.dni === dni && claveDia(a.fecha) === clave
        );
        if (!asistencia) return false;

        // 1. Baja local.
        set((state) => ({
          historial: state.historial.filter(
            (a) => (a.clientId ?? a.id) !== (asistencia.clientId ?? asistencia.id)
          ),
        }));

        // 2 y 3. Cancelar el pendiente; si ya se había subido, pedir la baja.
        const clientId = asistencia.clientId ?? asistencia.id;
        const eraPendiente = syncQueue.cancelAsistenciaPendiente(clientId);
        if (!eraPendiente) {
          syncQueue.enqueueAsistenciaBaja(asistencia);
        }

        return true;
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
