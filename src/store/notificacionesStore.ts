import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';

// Feature 2.4 — preferencias de recordatorios de entrenamiento (push local).
// El scheduling real lo hace src/services/notifications.ts con expo-notifications;
// acá sólo persistimos la preferencia del socio (activo + hora).
interface NotificacionesState {
  activo: boolean;
  hour: number; // 0-23
  minute: number; // 0-59
  permisoConcedido: boolean;
  setActivo: (activo: boolean) => void;
  setHora: (hour: number, minute: number) => void;
  setPermiso: (concedido: boolean) => void;
}

export const useNotificacionesStore = create<NotificacionesState>()(
  persist(
    (set) => ({
      activo: false,
      hour: 18,
      minute: 0,
      permisoConcedido: false,
      setActivo: (activo) => set({ activo }),
      setHora: (hour, minute) => set({ hour, minute }),
      setPermiso: (permisoConcedido) => set({ permisoConcedido }),
    }),
    {
      name: 'limefit-notificaciones-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);

export const useNotificaciones = () => useNotificacionesStore((s) => s);
