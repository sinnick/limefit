import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';
import { activeBrand } from '../../brands/registry';

// Crear instancia de MMKV — id por marca para aislar el storage entre marcas.
// Para 'limefit' el id sigue siendo 'limefit-storage' (se preserva el storage existente).
export const storage = new MMKV({
  id: `${activeBrand.key}-storage`,
});

// Adaptador para Zustand persist
export const zustandStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};

// Helper functions para MMKV
export const mmkvStorage = {
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),
  getObject: <T>(key: string): T | null => {
    const value = storage.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },
  delete: (key: string): void => storage.delete(key),
  clearAll: (): void => storage.clearAll(),
  getAllKeys: (): string[] => storage.getAllKeys(),
};
