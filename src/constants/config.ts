// API Configuration
export const API_BASE_URL = 'https://limefit-backend.vercel.app/api';

// App Configuration
export const APP_CONFIG = {
  name: 'LimeFit',
  version: '2.0.0',
  defaultRestTime: 90, // segundos
  maxSets: 10,
  maxReps: 100,
  maxWeight: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'limefit_user',
  SESSION: 'limefit_session',
  RUTINAS_CACHE: 'limefit_rutinas',
  RECORDS_CACHE: 'limefit_records',
  WORKOUT_PROGRESS: 'limefit_workout_progress',
  SETTINGS: 'limefit_settings',
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
