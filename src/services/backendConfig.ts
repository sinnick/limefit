// ============================================================================
// Config del backend (URL configurable en runtime).
//
// Espejo del patrón de tuta-passenger-app (src/lib/api/base-url.ts) pero sobre
// MMKV síncrono en vez de SecureStore: no hace falta un gate asíncrono al
// arranque, el valor se lee sincrónicamente en cada request (api.ts).
//
// La URL que el usuario configura es la del backend del gym SIN el sufijo /api
// (ej. https://sinnick.dev/level). La capa de red agrega /api para las llamadas
// (https://sinnick.dev/level/api/...). El tenant viaja además en el header
// X-Brand, así que el backend puede enrutar por path y/o por marca.
// ============================================================================
import { mmkvStorage } from '../store/storage';
import { STORAGE_KEYS, DEFAULT_BACKEND_URL } from '../constants/config';

// Quita espacios y barras finales: 'https://x/level/' -> 'https://x/level'.
const normalizeBase = (url: string): string => url.trim().replace(/\/+$/, '');

// URL cruda del backend tal como la ve/edita el usuario (sin /api).
export const getBackendUrl = (): string => {
  const stored = mmkvStorage.getString(STORAGE_KEYS.BACKEND_URL);
  return stored && isValidBackendUrl(stored) ? normalizeBase(stored) : DEFAULT_BACKEND_URL;
};

export const getDefaultBackendUrl = (): string => DEFAULT_BACKEND_URL;

// URL base que consume axios: agrega /api si la URL no lo trae ya.
export const getApiBaseUrl = (): string => {
  const base = getBackendUrl();
  return base.endsWith('/api') ? base : `${base}/api`;
};

// Guarda la URL configurada (normalizada). Devuelve la URL guardada.
export const setBackendUrl = (url: string): string => {
  const normalized = normalizeBase(url);
  mmkvStorage.setString(STORAGE_KEYS.BACKEND_URL, normalized);
  return normalized;
};

// Vuelve al default (borra el override persistido).
export const resetBackendUrl = (): void => {
  mmkvStorage.delete(STORAGE_KEYS.BACKEND_URL);
};

// Validación mínima: http(s) + un host. No exige TLD (admite IP:puerto local).
export const isValidBackendUrl = (url: string): boolean => {
  const trimmed = url.trim();
  return /^https?:\/\/[^\s/]+/i.test(trimmed);
};

// ¿La URL vigente difiere del default? (para mostrar el estado en la UI).
export const isUsingCustomBackend = (): boolean => getBackendUrl() !== DEFAULT_BACKEND_URL;
