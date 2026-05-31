import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSyncStore, MAX_ATTEMPTS } from '../services/syncQueue';

// ============================================================================
// Hook observable del estado de la cola de sync (CONTRACT-fase5A §2.2).
//
// Deriva counts a partir de `queue` (NO se persisten counts) y expone un `estado`
// de UI listo para el badge. Suscribe con useShallow para re-renderizar solo
// cuando cambian las primitivas que importan (no en cada mutación irrelevante).
// ============================================================================

export interface SyncStatus {
  pendientes: number;     // items 'pending' | 'failed' reintentables → "sin sincronizar"
  enCola: number;         // total de items en la cola (queue.length)
  sincronizando: boolean; // = isFlushing
  fallidos: number;       // 'failed' con attempts < MAX_ATTEMPTS (reintentables)
  agotados: number;       // 'failed' con attempts >= MAX_ATTEMPTS (requieren atención)
  ultimoError?: string;   // = store.lastError
  ultimoSyncAt?: number;  // = store.lastSyncAt
  proximoReintentoAt?: number; // min(nextRetryAt) de los failed reintentables
  estado: 'al_dia' | 'pendiente' | 'sincronizando' | 'error';
}

export function useSyncStatus(): SyncStatus {
  const { queue, isFlushing, lastError, lastSyncAt } = useSyncStore(
    useShallow((s) => ({
      queue: s.queue,
      isFlushing: s.isFlushing,
      lastError: s.lastError,
      lastSyncAt: s.lastSyncAt,
    }))
  );

  return useMemo<SyncStatus>(() => {
    const enCola = queue.length;

    let fallidos = 0;
    let agotados = 0;
    let proximoReintentoAt: number | undefined;

    for (const q of queue) {
      if (q.status === 'failed') {
        if (q.attempts >= MAX_ATTEMPTS) {
          agotados += 1;
        } else {
          fallidos += 1;
          const next = q.nextRetryAt ?? 0;
          if (proximoReintentoAt === undefined || next < proximoReintentoAt) {
            proximoReintentoAt = next;
          }
        }
      }
    }

    // "sin sincronizar": pending + inFlight + failed reintentables (excluye agotados).
    const pendientes = queue.filter(
      (q) => q.status !== 'failed' || q.attempts < MAX_ATTEMPTS
    ).length;

    let estado: SyncStatus['estado'];
    if (isFlushing) {
      estado = 'sincronizando';
    } else if (agotados > 0 || (lastError && pendientes > 0)) {
      estado = 'error';
    } else if (pendientes > 0) {
      estado = 'pendiente';
    } else {
      estado = 'al_dia';
    }

    return {
      pendientes,
      enCola,
      sincronizando: isFlushing,
      fallidos,
      agotados,
      ultimoError: lastError,
      ultimoSyncAt: lastSyncAt,
      proximoReintentoAt,
      estado,
    };
  }, [queue, isFlushing, lastError, lastSyncAt]);
}
