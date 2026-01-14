// User Types
export interface User {
  DNI: string;
  NAME: string;
  FOTO?: string;
  email?: string;
  createdAt?: string;
}

// Exercise Types
export interface Ejercicio {
  id: string;
  nombre: string;
  grupoMuscular: GrupoMuscular;
  equipamiento: Equipamiento;
  dificultad: Dificultad;
  instrucciones?: string;
  imagen?: string;
  video?: string;
}

export interface EjercicioEnRutina {
  id: string;
  ejercicioId: string;
  nombre: string;
  sets: number;
  reps: number;
  peso?: number;
  notas?: string;
  descanso?: number; // segundos
  completado?: boolean;
}

export type GrupoMuscular =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'piernas'
  | 'abdominales'
  | 'gluteos'
  | 'cardio'
  | 'fullbody';

export type Equipamiento =
  | 'barra'
  | 'mancuernas'
  | 'maquina'
  | 'cables'
  | 'peso_corporal'
  | 'kettlebell'
  | 'bandas';

export type Dificultad = 'principiante' | 'intermedio' | 'avanzado';

// Rutina Types
export interface DiaRutina {
  id: string;
  nombre: string;
  ejercicios: EjercicioEnRutina[];
}

export interface Rutina {
  id: string;
  _id?: string;
  nombre: string;
  descripcion?: string;
  dias: DiaRutina[];
  diasSemana?: DiaSemana[];
  tiempoEstimado?: number; // minutos
  createdAt?: string;
  updatedAt?: string;
}

export type DiaSemana = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

// Record Types
export interface Record {
  id: string;
  _id?: string;
  dni: string;
  ejercicioId: string;
  ejercicioNombre: string;
  peso: number;
  reps: number;
  fecha: string;
  notas?: string;
}

export interface PersonalRecord {
  ejercicioId: string;
  ejercicioNombre: string;
  pesoActual: number;
  pesoAnterior?: number;
  repsActual: number;
  fechaActual: string;
  fechaAnterior?: string;
  historial: RecordHistorial[];
}

export interface RecordHistorial {
  peso: number;
  reps: number;
  fecha: string;
}

// Workout Types
export interface WorkoutActivo {
  id: string;
  rutinaId: string;
  rutinaNombre: string;
  diaId: string;
  diaNombre: string;
  fechaInicio: string;
  ejercicios: EjercicioWorkout[];
  ejercicioActualIndex: number;
  tiempoTotal: number; // segundos
  estado: 'activo' | 'pausado' | 'completado';
}

export interface EjercicioWorkout {
  id: string;
  ejercicioId: string;
  nombre: string;
  setsObjetivo: number;
  repsObjetivo: number;
  pesoObjetivo?: number;
  setsCompletados: SetCompletado[];
  completado: boolean;
}

export interface SetCompletado {
  setNumero: number;
  peso: number;
  reps: number;
  completado: boolean;
  timestamp?: string;
  esRecord?: boolean;
}

// Workout History
export interface WorkoutCompletado {
  id: string;
  rutinaId: string;
  rutinaNombre: string;
  diaId: string;
  diaNombre: string;
  fecha: string;
  duracion: number; // minutos
  ejercicios: EjercicioWorkout[];
  volumenTotal: number; // peso total movido
  prsLogrados: number;
  notas?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginResponse {
  user: User;
}

export interface RutinasResponse {
  result_rutinas: Rutina[];
}

export interface RecordsResponse {
  result_records: Record[];
}

// Navigation Types
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Inicio: undefined;
  Rutinas: undefined;
  Rutina: { rutina: Rutina };
  Workout: { rutina: Rutina; diaId: string };
  Records: undefined;
  RecordDetail: { ejercicioId: string };
  Historial: undefined;
  Perfil: undefined;
};

export type MainTabParamList = {
  Inicio: undefined;
  Rutinas: undefined;
  Records: undefined;
  Perfil: undefined;
};

// Settings Types
export interface AppSettings {
  tiempoDescanso: number;
  vibracionActiva: boolean;
  sonidoActivo: boolean;
  unidadPeso: 'kg' | 'lb';
  temaOscuro: boolean;
}
