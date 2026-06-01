import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, AppStateStatus } from 'react-native';
import { zustandStorage } from '../store/storage';
import { STORAGE_KEYS } from '../constants/config';
import { useUserStore } from '../store/userStore';
import { recordsApi, workoutsApi, metricsApi, asistenciaApi, SyncBatchResult } from './api';
import { Record, WorkoutCompletado, MetricaCorporal, Asistencia } from '../types';

// ============================================================================
// Cola de sync OFFLINE-FIRST (CONTRACT c).
//
// La app es la fuente de verdad local: un record/workout se guarda primero en
// MMKV (instantáneo, sin red) y SOLO DESPUÉS se intenta subir. La subida pasa por
// esta cola persistida; nada se pierde si la app se cierra, no hay red o el server
// está caído. La idempotencia por `clientId` hace seguro el reintento: reenviar el
// mismo lote es un no-op en el backend (upsert por (GYM_ID, DNI, CLIENT_ID)).
//
// Encolar (enqueueRecord/enqueueWorkout) es SIEMPRE síncrono y local; nunca
// bloquea la UI. El flush() agrupa por tipo y llama a los endpoints batch
// (recordsApi.subirRecords / workoutsApi.subirWorkouts) — un request por tipo.
// ============================================================================

export type SyncEntityType = 'record' | 'workout' | 'metric' | 'asistencia';
export type SyncStatus = 'pending' | 'inFlight' | 'failed';

export interface SyncQueueItem {
  clientId: string; // UUID estable; clave de idempotencia (= id local del record/workout/metric)
  type: SyncEntityType; // 'record' | 'workout' | 'metric' | 'asistencia'
  payload: Record | WorkoutCompletado | MetricaCorporal | Asistencia; // el objeto ya en formato de la app
  dni: string;
  status: SyncStatus; // pending → inFlight → (ok: se elimina) | failed
  attempts: number; // nº de reintentos
  nextRetryAt?: number; // epoch ms; backoff (solo se procesa si <= now)
  lastError?: string;
  createdAt: string; // ISO
}

interface SyncState {
  queue: SyncQueueItem[];
  isFlushing: boolean;
  // Telemetría observable (CONTRACT-fase5A §2.1). NO se recalcula: la escribe flush().
  lastSyncAt?: number; // epoch ms del último flush que terminó (con o sin éxito)
  lastError?: string;  // último error de red/lote observado en el flush más reciente
  enqueueRecord: (r: Record) => void;
  enqueueWorkout: (w: WorkoutCompletado) => void;
  enqueueMetric: (m: MetricaCorporal) => void;
  enqueueAsistencia: (a: Asistencia) => void;
  flush: () => Promise<void>;
  markSynced: (clientIds: string[]) => void; // elimina de la cola
  markFailed: (clientId: string, error: string) => void;
}

// Tope de reintentos automáticos (CONTRACT c.6). Pasado el tope el item queda
// `failed` y NO se reintenta solo, pero PERMANECE en la cola (no se descarta).
export const MAX_ATTEMPTS = 10;

// Backoff exponencial con tope: min(2^attempts * 5s, 5min) (CONTRACT c.4 #4).
const backoff = (attempts: number): number => {
  const ms = Math.pow(2, attempts) * 5_000;
  return Math.min(ms, 5 * 60_000);
};

// DNI del socio logueado al momento de encolar. Los records creados en
// checkAndUpdatePR nacen con dni '', así que la verdad la da el userStore.
const currentDni = (): string => useUserStore.getState().user?.DNI ?? '';

// ¿El item está listo para procesarse en este flush? (CONTRACT c.4 #4 / c.6)
//  - inFlight de un flush previo que murió a medias: se reintenta.
//  - failed: solo si superó su nextRetryAt y no agotó MAX_ATTEMPTS.
//  - pending: siempre.
const isDue = (item: SyncQueueItem, now: number): boolean => {
  if (item.status === 'failed') {
    if (item.attempts >= MAX_ATTEMPTS) return false;
    return (item.nextRetryAt ?? 0) <= now;
  }
  // pending / inFlight
  return true;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      queue: [],
      isFlushing: false,
      lastSyncAt: undefined,
      lastError: undefined,

      // Encolar un record/PR. Síncrono y local. Idempotencia: clientId = id local.
      enqueueRecord: (record) => {
        const dni = record.dni || currentDni();
        const clientId = record.clientId ?? record.id;
        const payload: Record = { ...record, dni, clientId };

        set((state) => {
          // Evitar duplicar el mismo clientId si ya está en cola (re-enqueue).
          if (state.queue.some((q) => q.clientId === clientId)) return state;
          const item: SyncQueueItem = {
            clientId,
            type: 'record',
            payload,
            dni,
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
          };
          return { queue: [...state.queue, item] };
        });

        // Intento optimista inmediato (CONTRACT c.4 #3): si hay red, sube ya; si no,
        // el request falla y el item vuelve a 'failed' con backoff (no se pierde).
        void get().flush();
      },

      // Encolar un workout completado. clientId = WorkoutCompletado.id ya existente.
      enqueueWorkout: (workout) => {
        const dni = currentDni();
        const clientId = workout.id;

        set((state) => {
          if (state.queue.some((q) => q.clientId === clientId)) return state;
          const item: SyncQueueItem = {
            clientId,
            type: 'workout',
            payload: workout,
            dni,
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
          };
          return { queue: [...state.queue, item] };
        });

        void get().flush();
      },

      // Encolar una métrica corporal. Síncrono y local. Idempotencia: clientId =
      // metric.clientId ?? metric.id. Igual que records: el DNI lo resuelve la cola
      // desde el userStore si el objeto nace con dni ''.
      enqueueMetric: (metric) => {
        const dni = metric.dni || currentDni();
        const clientId = metric.clientId ?? metric.id;
        const payload: MetricaCorporal = { ...metric, dni, clientId };

        set((state) => {
          if (state.queue.some((q) => q.clientId === clientId)) return state;
          const item: SyncQueueItem = {
            clientId,
            type: 'metric',
            payload,
            dni,
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
          };
          return { queue: [...state.queue, item] };
        });

        void get().flush();
      },

      // Encolar una asistencia / check-in (CONTRACT-fase2 §2.5). Síncrono y local.
      // Idempotencia: clientId = asistencia.clientId ?? asistencia.id. El backend
      // colapsa por (GYM_ID, DNI, FECHA-día), así que reintentos del mismo día son
      // no-op. El DNI lo resuelve la cola desde userStore si nace con dni ''.
      enqueueAsistencia: (asistencia) => {
        const dni = asistencia.dni || currentDni();
        const clientId = asistencia.clientId ?? asistencia.id;
        const payload: Asistencia = { ...asistencia, dni, clientId };

        set((state) => {
          if (state.queue.some((q) => q.clientId === clientId)) return state;
          const item: SyncQueueItem = {
            clientId,
            type: 'asistencia',
            payload,
            dni,
            status: 'pending',
            attempts: 0,
            createdAt: new Date().toISOString(),
          };
          return { queue: [...state.queue, item] };
        });

        void get().flush();
      },

      // Elimina los items ya sincronizados de la cola (CONTRACT c.5). La verdad ya
      // vive en el backend y en el historial/records local.
      markSynced: (clientIds) =>
        set((state) => ({
          queue: state.queue.filter((q) => !clientIds.includes(q.clientId)),
        })),

      // Marca un item como fallido: status 'failed', attempts++, programa backoff
      // (CONTRACT c.5 / c.6). NO se descarta.
      markFailed: (clientId, error) =>
        set((state) => ({
          queue: state.queue.map((q) => {
            if (q.clientId !== clientId) return q;
            const attempts = q.attempts + 1;
            return {
              ...q,
              status: 'failed' as SyncStatus,
              attempts,
              lastError: error,
              nextRetryAt: Date.now() + backoff(attempts),
            };
          }),
        })),

      // Flush reentrante-safe: agrupa por tipo y dispara un request batch por tipo.
      flush: async () => {
        const state = get();
        if (state.isFlushing) return; // reentrante-safe (CONTRACT c.4)

        const now = Date.now();
        const due = state.queue.filter((q) => isDue(q, now));
        if (due.length === 0) return;

        // Agrupar por DNI: cada socio sube su propio lote (un device puede haber
        // logueado a más de un DNI a lo largo del tiempo; sin DNI no se puede subir).
        const records = due.filter(
          (q): q is SyncQueueItem & { payload: Record } => q.type === 'record' && !!q.dni
        );
        const workouts = due.filter(
          (q): q is SyncQueueItem & { payload: WorkoutCompletado } =>
            q.type === 'workout' && !!q.dni
        );
        const metrics = due.filter(
          (q): q is SyncQueueItem & { payload: MetricaCorporal } =>
            q.type === 'metric' && !!q.dni
        );
        const asistencias = due.filter(
          (q): q is SyncQueueItem & { payload: Asistencia } =>
            q.type === 'asistencia' && !!q.dni
        );
        if (
          records.length === 0 &&
          workouts.length === 0 &&
          metrics.length === 0 &&
          asistencias.length === 0
        )
          return;

        set({ isFlushing: true });

        // Error de red/lote observado en ESTE flush (CONTRACT-fase5A §2.1). Se
        // escribe en el store al terminar; si el flush sale limpio se limpia.
        let flushError: string | undefined;

        // Marcar lo que va a salir como inFlight (CONTRACT c.5).
        const inFlightIds = new Set(
          [...records, ...workouts, ...metrics, ...asistencias].map((q) => q.clientId)
        );
        set((s) => ({
          queue: s.queue.map((q) =>
            inFlightIds.has(q.clientId) ? { ...q, status: 'inFlight' as SyncStatus } : q
          ),
        }));

        // Procesa un lote homogéneo (mismo tipo, mismo DNI) y aplica los resultados.
        const procesarGrupo = async (
          dni: string,
          items: SyncQueueItem[],
          subir: () => Promise<SyncBatchResult[]>
        ) => {
          try {
            const results = await subir();
            const byClientId = new Map(results.map((r) => [r.clientId, r]));
            const synced: string[] = [];
            for (const item of items) {
              const res = byClientId.get(item.clientId);
              if (res?.ok) {
                // ok incluye created:false (ya existía = idempotencia) → cuenta éxito.
                synced.push(item.clientId);
              } else {
                // Error por item (validación): reintento con backoff, no se pierde.
                get().markFailed(item.clientId, res?.error ?? 'sin resultado en el batch');
              }
            }
            if (synced.length > 0) get().markSynced(synced);
          } catch (err: any) {
            // Falla la request entera (sin red, timeout, 5xx): TODO el lote vuelve a
            // failed con attempts++ y backoff (CONTRACT c.5). Nada se pierde.
            const msg = err?.message ?? 'error de red';
            flushError = msg; // telemetría: último error del flush (CONTRACT-fase5A §2.1)
            for (const item of items) get().markFailed(item.clientId, msg);
          }
        };

        try {
          // Records agrupados por DNI.
          const recordsByDni = groupByDni(records);
          for (const [dni, items] of recordsByDni) {
            await procesarGrupo(dni, items, () =>
              recordsApi.subirRecords(dni, items.map((q) => q.payload as Record))
            );
          }

          // Workouts agrupados por DNI.
          const workoutsByDni = groupByDni(workouts);
          for (const [dni, items] of workoutsByDni) {
            await procesarGrupo(dni, items, () =>
              workoutsApi.subirWorkouts(dni, items.map((q) => q.payload as WorkoutCompletado))
            );
          }

          // Métricas corporales agrupadas por DNI (CONTRACT-fase1 §2.2, offline-first).
          const metricsByDni = groupByDni(metrics);
          for (const [dni, items] of metricsByDni) {
            await procesarGrupo(dni, items, () =>
              metricsApi.subir(dni, items.map((q) => q.payload as MetricaCorporal))
            );
          }

          // Asistencias / check-ins agrupados por DNI (CONTRACT-fase2 §2.5,
          // offline-first). El endpoint /asistencia/checkin es por-item (no batch),
          // así que se dispara una request por asistencia y se adapta cada
          // CheckinResult a la forma SyncBatchResult que espera procesarGrupo
          // (alineado por clientId; created:false del mismo día sigue siendo ok).
          const asistenciasByDni = groupByDni(asistencias);
          for (const [dni, items] of asistenciasByDni) {
            await procesarGrupo(dni, items, async () => {
              const results = await Promise.all(
                items.map((q) =>
                  asistenciaApi.checkIn(dni, q.payload as Asistencia)
                )
              );
              return results.map(
                (r): SyncBatchResult => ({
                  clientId: r.clientId,
                  ok: r.ok,
                  created: r.created,
                  error: r.error,
                })
              );
            });
          }
        } finally {
          // Telemetría observable (CONTRACT-fase5A §2.1): timestamp del flush que
          // terminó (con o sin éxito) y último error. Si el flush salió limpio se
          // limpia lastError para reflejar "al día".
          set({ isFlushing: false, lastSyncAt: Date.now(), lastError: flushError });
        }
      },
    }),
    {
      // Clave de storage por marca (CONTRACT c.2): ${KEY_PREFIX}sync_queue.
      name: STORAGE_KEYS.SYNC_QUEUE,
      storage: createJSONStorage(() => zustandStorage),
      // partialize: persistir la cola + telemetría (NO isFlushing) (CONTRACT c.2 /
      // fase5A §2.1). lastSyncAt/lastError sobreviven reinicios para que el badge
      // muestre el último estado conocido sin esperar al primer flush.
      partialize: (state) => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
        lastError: state.lastError,
      }),
      onRehydrateStorage: () => (state) => {
        // Items que quedaron 'inFlight' cuando la app murió a mitad de un flush:
        // devolverlos a 'pending' para que el próximo flush los reintente.
        if (state) {
          state.isFlushing = false;
          state.queue = state.queue.map((q) =>
            q.status === 'inFlight' ? { ...q, status: 'pending' as SyncStatus } : q
          );
        }
      },
    }
  )
);

// Agrupa items por DNI manteniendo el tipado del payload.
function groupByDni<T extends SyncQueueItem>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const arr = map.get(item.dni);
    if (arr) arr.push(item);
    else map.set(item.dni, [item]);
  }
  return map;
}

// ============================================================================
// Triggers de flush (CONTRACT c.4). Se llama UNA vez al arrancar la app
// (ej. desde App.tsx). Es idempotente: registrar listeners más de una vez no
// duplica el efecto observable (flush es reentrante-safe).
// ============================================================================

let triggersIniciados = false;

export const initSyncQueueTriggers = (): (() => void) => {
  if (triggersIniciados) return () => {};
  triggersIniciados = true;

  const cleanups: Array<() => void> = [];

  // 1) Foreground: al volver la app a 'active' se intenta vaciar la cola
  //    (junto al refetch de React Query que ya existe).
  const onAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') void useSyncStore.getState().flush();
  };
  const appStateSub = AppState.addEventListener('change', onAppStateChange);
  cleanups.push(() => appStateSub.remove());

  // 2) Recuperar conectividad: suscribirse a NetInfo si está disponible.
  //    @react-native-community/netinfo es OPCIONAL: si no está instalado, este
  //    trigger se omite sin romper la app (los triggers 1, 3 y 4 igual cubren el
  //    flush). Cuando se agregue la dependencia, se engancha automáticamente.
  try {
    // require dinámico y guardado: no es un import estático para que Metro no
    // falle el bundle si el paquete no está instalado.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const NetInfo = require('@react-native-community/netinfo')?.default;
    if (NetInfo?.addEventListener) {
      const unsub = NetInfo.addEventListener((s: any) => {
        if (s?.isConnected) void useSyncStore.getState().flush();
      });
      cleanups.push(() => {
        if (typeof unsub === 'function') unsub();
      });
    }
  } catch {
    // netinfo no instalado: se ignora (trigger opcional).
  }

  // 3) Poll de reintento (CONTRACT-fase5A §2.5). Reemplaza el trigger de
  //    "recuperó conectividad" que daba NetInfo (no instalado). Cada 30s intenta
  //    un flush SOLO si hay items reintentables (pending/inFlight, o failed con
  //    attempts < MAX_ATTEMPTS). flush es reentrante-safe e isDue respeta el
  //    backoff, así que el poll nunca fuerza reintentos antes de tiempo.
  const pollId = setInterval(() => {
    const { queue } = useSyncStore.getState();
    const hayReintentables = queue.some(
      (q) => q.status !== 'failed' || q.attempts < MAX_ATTEMPTS
    );
    if (hayReintentables) void useSyncStore.getState().flush();
  }, 30_000);
  cleanups.push(() => clearInterval(pollId));

  // 4) Intento inmediato al arrancar (drena lo que quedó pendiente de sesiones
  //    anteriores en cuanto la app abre con red).
  void useSyncStore.getState().flush();

  return () => {
    for (const c of cleanups) c();
    triggersIniciados = false;
  };
};

// Helper de conveniencia para los stores (evita que importen el store directo
// y arma un punto único de enganche).
export const syncQueue = {
  enqueueRecord: (r: Record) => useSyncStore.getState().enqueueRecord(r),
  enqueueWorkout: (w: WorkoutCompletado) => useSyncStore.getState().enqueueWorkout(w),
  enqueueMetric: (m: MetricaCorporal) => useSyncStore.getState().enqueueMetric(m),
  enqueueAsistencia: (a: Asistencia) => useSyncStore.getState().enqueueAsistencia(a),
  flush: () => useSyncStore.getState().flush(),
};
