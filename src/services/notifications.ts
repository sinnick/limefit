import * as Notifications from 'expo-notifications';
import type { DiaSemana } from '../types';

// Feature 2.4 — recordatorios de entrenamiento como notificaciones LOCALES
// recurrentes (no requieren servidor de push). Se agendan según los DIAS_SEMANA
// de las rutinas asignadas. Requiere build nativo del dev-client con
// expo-notifications (en Expo Go las notificaciones locales son limitadas).

// Mostrar la notificación aunque la app esté en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Mapa día (español, como DIAS_SEMANA del backend) → weekday de expo (1=domingo … 7=sábado).
const WEEKDAY: Record<DiaSemana, number> = {
  domingo: 1,
  lunes: 2,
  martes: 3,
  miercoles: 4,
  jueves: 5,
  viernes: 6,
  sabado: 7,
};

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  return status === 'granted';
}

// Cancela los recordatorios previos y agenda uno semanal por cada día de
// entrenamiento, a la hora elegida. Devuelve la cantidad agendada.
export async function agendarRecordatorios(
  dias: DiaSemana[],
  hour: number,
  minute: number
): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const unicos = Array.from(new Set(dias)).filter((d) => d in WEEKDAY);
  for (const dia of unicos) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Hora de entrenar! 💪',
        body: 'Tu rutina de hoy te espera. Vamos al próximo level.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: WEEKDAY[dia],
        hour,
        minute,
      },
    });
  }
  return unicos.length;
}

export async function cancelarRecordatorios(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
