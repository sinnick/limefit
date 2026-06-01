import { QueryClient, dehydrate, hydrate } from '@tanstack/react-query';
import { mmkvStorage } from '../store/storage';
import { STORAGE_KEYS } from '../constants/config';

// ============================================================================
// Persistencia manual de la caché de React Query en MMKV (CONTRACT-fase5A §2.6).
//
// NO usamos @tanstack/react-query-persist-client (no instalado, sin libs nuevas).
// Implementamos persister + bootstrap a mano sobre mmkvStorage (síncrono).
//
// Ventaja de MMKV síncrono: la restauración es síncrona, así que la caché queda
// lista ANTES del primer render de queries → no hace falta gate de "isRestoring".
// ============================================================================

// Allowlist de queries a persistir, por queryKey[0] (alineado con QUERY_KEYS).
const ALLOWED_KEYS = new Set<string>([
  'rutinas',
  'records',
  'metrics',
  'asistencia',
  'membresia',
  'clases',
  'reservas',
  'anuncios',
]);

const MAX_AGE = 24 * 60 * 60 * 1000; // 24h
const DEBOUNCE_MS = 1000;

interface PersistedCache {
  timestamp: number;
  clientState: ReturnType<typeof dehydrate>;
}

// ¿Esta query entra en la allowlist? (queryKey[0] string en la lista).
const esPersistible = (queryKey: readonly unknown[]): boolean => {
  const head = queryKey[0];
  return typeof head === 'string' && ALLOWED_KEYS.has(head);
};

// Hidrata la caché desde MMKV si no expiró (síncrono). CONTRACT-fase5A §2.6.
export function restaurarQueryClient(queryClient: QueryClient): void {
  const persisted = mmkvStorage.getObject<PersistedCache>(STORAGE_KEYS.RQ_CACHE);
  if (!persisted) return;

  // Expirada: descartar para no mostrar datos viejos.
  if (Date.now() - persisted.timestamp > MAX_AGE) {
    mmkvStorage.delete(STORAGE_KEYS.RQ_CACHE);
    return;
  }

  try {
    hydrate(queryClient, persisted.clientState);
  } catch {
    // Estado corrupto/incompatible: descartar, la app refetchea con red.
    mmkvStorage.delete(STORAGE_KEYS.RQ_CACHE);
  }
}

// Suscribe al QueryCache y persiste (con debounce) las queries permitidas.
// Devuelve el unsubscribe. CONTRACT-fase5A §2.6.
export function persistirQueryClient(queryClient: QueryClient): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const guardar = () => {
    const clientState = dehydrate(queryClient, {
      shouldDehydrateQuery: (query) =>
        query.state.status === 'success' && esPersistible(query.queryKey),
      // No persistimos mutations (la cola de sync ya cubre la escritura offline).
      shouldDehydrateMutation: () => false,
    });
    const payload: PersistedCache = { timestamp: Date.now(), clientState };
    mmkvStorage.setObject(STORAGE_KEYS.RQ_CACHE, payload);
  };

  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(guardar, DEBOUNCE_MS);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
