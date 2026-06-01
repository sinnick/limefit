import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { syncQueue } from '../services/syncQueue';
import { MetricaCorporal } from '../types';

// ============================================================================
// Store de métricas corporales (CONTRACT-fase1 §4.1 / 1.3). Offline-first:
// `addMetric` guarda local (MMKV) y encola para subir (enqueueMetric). La verdad
// local vive acá; `setMetrics` la reemplaza con lo que llega del backend (list).
// ============================================================================

interface BodyMetricsState {
  metrics: MetricaCorporal[];
  setMetrics: (metrics: MetricaCorporal[]) => void;
  addMetric: (metric: MetricaCorporal) => void;
}

const generarId = () => Math.random().toString(36).substring(2, 9);

// Merge backend + local por clientId/id evitando duplicados; ordenado por fecha desc.
const ordenarPorFecha = (metrics: MetricaCorporal[]): MetricaCorporal[] =>
  [...metrics].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

export const useBodyMetricsStore = create<BodyMetricsState>()(
  persist(
    (set, get) => ({
      metrics: [],

      // Reemplaza el set local con lo que trae el backend (list). Hace merge con las
      // métricas locales que aún no se subieron (mismo clientId) para no perderlas.
      setMetrics: (metrics) =>
        set((state) => {
          const fromBackend = new Map(
            metrics.map((m) => [m.clientId ?? m.id, m] as const)
          );
          // Conservar locales pendientes que el backend todavía no devolvió.
          const pendientesLocales = state.metrics.filter(
            (m) => !fromBackend.has(m.clientId ?? m.id)
          );
          return { metrics: ordenarPorFecha([...metrics, ...pendientesLocales]) };
        }),

      // Alta local + encolar (offline-first). El id local es la clave de idempotencia.
      addMetric: (metric) => {
        const id = metric.id || generarId();
        const nueva: MetricaCorporal = {
          ...metric,
          id,
          clientId: metric.clientId ?? id,
          fecha: metric.fecha || new Date().toISOString(),
        };

        set((state) => ({
          metrics: ordenarPorFecha([
            nueva,
            ...state.metrics.filter((m) => (m.clientId ?? m.id) !== (nueva.clientId ?? nueva.id)),
          ]),
        }));

        // Offline-first (CONTRACT c.3): tras guardar local, encolar para subir.
        syncQueue.enqueueMetric(nueva);
      },
    }),
    {
      name: 'limefit-bodymetrics-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ metrics: state.metrics }),
    }
  )
);

// Selectores
export const useBodyMetrics = () => useBodyMetricsStore((state) => state.metrics);
