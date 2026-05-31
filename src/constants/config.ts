import { activeBrand } from '../../brands/registry';

// API Configuration — backend multi-tenant.
// Override para apuntar a un backend local con EXPO_PUBLIC_API_URL (se inlinea
// en build; requiere reiniciar Metro con --clear). Ej. para el backend local:
//   EXPO_PUBLIC_API_URL=http://192.168.100.108:3000/level/api   (tenant 'level')
//   EXPO_PUBLIC_API_URL=http://192.168.100.108:3000/limefit/api (tenant 'limefit')
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://limefit-backend.vercel.app/api';

// Identificador de tenant que se envía al backend en cada request (header X-Brand).
export const TENANT_ID = activeBrand.tenantId;

// App Configuration
export const APP_CONFIG = {
  name: activeBrand.appName,
  version: '2.0.0',
  defaultRestTime: 90, // segundos
  maxSets: 10,
  maxReps: 100,
  maxWeight: 1000,
} as const;

// Storage Keys — prefijadas por marca para aislar datos entre marcas en el mismo device.
// Para 'limefit' el prefijo da 'limefit_*', idéntico a la versión previa (no rompe usuarios).
const KEY_PREFIX = `${activeBrand.key}_`;

export const STORAGE_KEYS = {
  USER: `${KEY_PREFIX}user`,
  SESSION: `${KEY_PREFIX}session`,
  RUTINAS_CACHE: `${KEY_PREFIX}rutinas`,
  RECORDS_CACHE: `${KEY_PREFIX}records`,
  WORKOUT_PROGRESS: `${KEY_PREFIX}workout_progress`,
  SETTINGS: `${KEY_PREFIX}settings`,
  // Cola de sync offline-first (CONTRACT c.2). Persistida en MMKV por marca.
  SYNC_QUEUE: `${KEY_PREFIX}sync_queue`,
  // Caché de React Query persistida en MMKV (CONTRACT-fase5A §2.6).
  RQ_CACHE: `${KEY_PREFIX}rq_cache`,
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  USER: ['user'],
  RUTINAS: ['rutinas'],
  RUTINA: (id: string) => ['rutina', id],
  RECORDS: ['records'],
  RECORD: (ejercicioId: string) => ['record', ejercicioId],
  WORKOUT_HISTORY: ['workoutHistory'],
  METRICS: ['metrics'], // Fase 1 (1.3) — métricas corporales por DNI
  // Fase 4
  MEMBRESIA: ['membresia'],
  CLASES: ['clases'],
  RESERVAS: ['reservas'],
  ANUNCIOS: ['anuncios'],
} as const;
