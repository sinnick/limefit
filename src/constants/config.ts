import { activeBrand } from '../../brands/registry';

// API Configuration — backend multi-tenant compartido por todas las marcas.
export const API_BASE_URL = 'https://limefit-backend.vercel.app/api';

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
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  USER: ['user'],
  RUTINAS: ['rutinas'],
  RUTINA: (id: string) => ['rutina', id],
  RECORDS: ['records'],
  RECORD: (ejercicioId: string) => ['record', ejercicioId],
  WORKOUT_HISTORY: ['workoutHistory'],
} as const;
