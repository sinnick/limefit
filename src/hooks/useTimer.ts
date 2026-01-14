import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../store/userStore';

interface UseTimerOptions {
  initialTime?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  tiempo: number;
  isRunning: boolean;
  isPaused: boolean;
  start: (tiempo?: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
  formatTime: (seconds: number) => string;
}

export const useTimer = (options: UseTimerOptions = {}): UseTimerReturn => {
  const { initialTime = 0, onComplete, autoStart = false } = options;
  const settings = useSettings();

  const [tiempo, setTiempo] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Actualizar ref cuando cambia onComplete
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Cleanup del interval
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Efecto del timer
  useEffect(() => {
    if (isRunning && tiempo > 0) {
      intervalRef.current = setInterval(() => {
        setTiempo((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            if (settings.vibracionActiva) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            onCompleteRef.current?.();
            return 0;
          }
          // Vibrar en los últimos 3 segundos
          if (newTime <= 3 && settings.vibracionActiva) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tiempo, settings.vibracionActiva]);

  const start = useCallback((newTime?: number) => {
    setTiempo(newTime ?? initialTime);
    setIsRunning(true);
    setIsPaused(false);
  }, [initialTime]);

  const pause = useCallback(() => {
    setIsRunning(false);
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setTiempo(initialTime);
    setIsRunning(false);
    setIsPaused(false);
  }, [initialTime]);

  const stop = useCallback(() => {
    setTiempo(0);
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    tiempo,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
    stop,
    formatTime,
  };
};

// Hook para cronómetro (cuenta hacia arriba)
export const useStopwatch = () => {
  const [tiempo, setTiempo] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTiempo((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTiempo(0);
    setIsRunning(false);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    tiempo,
    isRunning,
    start,
    pause,
    reset,
    formatTime,
    formatted: formatTime(tiempo),
  };
};
