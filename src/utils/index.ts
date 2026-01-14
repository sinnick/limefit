// Date utilities
export const formatDate = (date: string | Date, format: 'short' | 'long' = 'short'): string => {
  const d = new Date(date);

  if (format === 'short') {
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  }

  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Number utilities
export const formatWeight = (weight: number, unit: 'kg' | 'lb' = 'kg'): string => {
  if (unit === 'lb') {
    return `${(weight * 2.205).toFixed(1)} lb`;
  }
  return `${weight} kg`;
};

export const formatVolume = (volume: number): string => {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k`;
  }
  return volume.toString();
};

// ID generator
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

// Array utilities
export const reorder = <T>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

// Validation utilities
export const isValidDNI = (dni: string): boolean => {
  return dni.length >= 7 && /^\d+$/.test(dni);
};

// Greeting utility
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

// Muscle group colors
export const getMuscleGroupColor = (grupo: string): string => {
  const colors: Record<string, string> = {
    pecho: '#C4F135',
    espalda: '#3B82F6',
    hombros: '#F59E0B',
    biceps: '#10B981',
    triceps: '#10B981',
    piernas: '#EF4444',
    abdominales: '#9CA3AF',
    gluteos: '#EF4444',
    cardio: '#F59E0B',
    fullbody: '#C4F135',
  };
  return colors[grupo.toLowerCase()] || '#9CA3AF';
};
