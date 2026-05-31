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
  unidadPeso?: 'kg' | 'lb'; // refleja backend unidadPeso (default "kg")
  notas?: string;
  descanso?: number; // segundos
  orden?: number; // orden del ejercicio dentro del día (backend orden)
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
  orden?: number; // orden del día dentro de la rutina (backend orden)
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
  clientId?: string; // clave de idempotencia para la cola de sync (= id local). CLIENT_ID en backend
  dni: string;
  ejercicioId: string;
  ejercicioNombre: string;
  peso: number;
  reps: number;
  fecha: string;
  notas?: string;
  esRecord?: boolean; // ES_RECORD en backend; la app detecta el PR localmente
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
  rpe?: number;   // NUEVO 2.3: esfuerzo percibido 1-10 (entero). undefined = no registrado
  notas?: string; // NUEVO 2.3: nota libre del set
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
  user: User | null; // null si el DNI no existe (CONTRACT b.1)
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
  RecordDetail: { ejercicioId: string; ejercicioNombre?: string }; // 1.2 (AMPLIAR la existente)
  Historial: undefined;
  Perfil: undefined;
  Metricas: undefined; // 1.3
  Calendario: undefined; // 1.6
  EditarPerfil: undefined; // 1.5
  // Feature 2.1 / 2.2
  Biblioteca: { grupoMuscular?: string; modoSustitucion?: boolean; ejercicioIndex?: number } | undefined;
  DetalleEjercicio: { ejercicioId: string };
  // Feature 2.5
  ScanQR: undefined;
  // Feature 2.4 (settings de recordatorios)
  Notificaciones: undefined;
  // Feature 4.1 / 4.3 / 4.4
  Membresia: undefined;
  Clases: undefined;
  MisReservas: undefined;
  Anuncios: undefined;
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

// ============================================================================
// Fase 1 — tipos nuevos (CONTRACT-fase1 §1). Agregados al final, sin reordenar.
// ============================================================================

// --- 1.a Métricas corporales (1.3) ---------------------------------------
// Métrica corporal (peso, % grasa, perímetros) en una fecha. Offline-first:
// clientId = clave de idempotencia (= id local), igual que Record (CONTRACT b.3).
export interface MedidasCorporales {
  pecho?: number; // cm
  cintura?: number; // cm
  cadera?: number; // cm
  brazo?: number; // cm
  muslo?: number; // cm
}

export interface MetricaCorporal {
  id: string;
  _id?: string;
  clientId?: string; // CLIENT_ID en backend (idempotencia)
  dni: string;
  fecha: string; // ISO
  peso?: number; // peso corporal (kg/lb según settings.unidadPeso)
  porcentajeGrasa?: number; // %
  medidas?: MedidasCorporales;
  notas?: string;
}

// --- 1.b Perfil editable (1.5) -------------------------------------------
// Payload de edición de perfil del socio (PATCH por DNI). DNI NO es editable.
export interface PerfilUpdate {
  nombre?: string; // → NOMBRE
  apellido?: string; // → APELLIDO
  email?: string; // → EMAIL
  foto?: string; // → FOTO (URL o dataURI)
  sexo?: 'M' | 'F' | string; // → SEXO
  pesoObjetivo?: number; // → PESO_OBJETIVO (campo nuevo en Usuario)
}

// --- 1.c Rachas y logros (1.4) -------------------------------------------
// Se calculan LOCALMENTE (sin endpoint ni modelo backend) sobre
// workoutStore.historialWorkouts y recordsStore (ver utils/achievements.ts).
export interface Racha {
  actual: number; // días/semanas consecutivos vigentes
  mejor: number; // récord histórico
  ultimaFecha?: string; // ISO del último entrenamiento contado
  unidad: 'dias' | 'semanas';
}

export type LogroId =
  | 'primer_entreno' | 'entrenos_10' | 'entrenos_50' | 'entrenos_100'
  | 'primer_pr' | 'prs_10' | 'prs_25'
  | 'racha_7' | 'racha_30';

export interface Logro {
  id: LogroId;
  titulo: string;
  descripcion: string;
  desbloqueado: boolean;
  fechaDesbloqueo?: string; // ISO, si desbloqueado
  progreso: number; // 0..1 hacia el hito
}

// ============================================================================
// Fase 2 — tipos nuevos (CONTRACT-fase2 §1). Agregados al final, sin reordenar.
// ============================================================================

// --- Feature 2.1: Biblioteca de ejercicios (shape del backend, camelCase) ---
// El tipo `Ejercicio` legacy (líneas ~11) usa enums en español para rutinas;
// la biblioteca proviene del seed inglés y usa strings crudos del backend.
export interface EjercicioBiblioteca {
  id: string;            // _id de Mongo (string)
  nombre: string;        // <- NOMBRE
  grupoMuscular: string; // <- GRUPO_MUSCULAR (inglés del seed: "biceps","chest","triceps","abdominals",...)
  tipo?: string;         // <- TIPO ("strength","powerlifting")
  equipo?: string;       // <- EQUIPO ("body_only","dumbbell","barbell","e-z_curl_bar","cable","other","None")
  dificultad?: string;   // <- DIFICULTAD ("beginner","intermediate","advanced")
  instrucciones?: string;// <- INSTRUCCIONES
  imagen?: string;       // <- URL_IMAGEN ("" por ahora)
}

export interface EjerciciosSearchResponse {
  status: 'ok' | 'error';
  ejercicios: EjercicioBiblioteca[];
  total: number;
}

// --- Feature 2.5: Asistencia / check-in (offline-first, type 'asistencia' en syncQueue) ---
export type MetodoCheckin = 'qr' | 'dni' | 'manual';

export interface Asistencia {
  id: string;            // id local (UUID) = clientId de idempotencia
  clientId?: string;     // CLIENT_ID en backend; default = id
  dni: string;
  fecha: string;         // ISO; el backend la normaliza a medianoche UTC para la unicidad por día
  horaCheckin?: string;  // ISO con hora; <- HORA_CHECKIN
  metodo: MetodoCheckin; // <- METODO
  notas?: string;        // <- NOTAS
}

export interface AsistenciaResponse {
  status: 'ok' | 'error';
  asistencias: Asistencia[];
  total: number;
}

// ============================================================================
// Fase 4 — tipos nuevos (CONTRACT-fase4-app.md §1). Agregados al final, sin reordenar.
// ============================================================================

// --- 4.1 Membresía / estado de cuota (INT-4.1) ---------------------------
// `estado` es un string crudo del backend (calcularEstadoCuota). Union ABIERTA
// para tolerar valores no previstos; la pantalla mapea a etiqueta/color con default.
export type EstadoCuota = 'al_dia' | 'vencido' | 'suspendida' | (string & {});

export interface Membresia {
  tieneMembresia: boolean;
  estado?: EstadoCuota;     // solo si tieneMembresia
  planNombre?: string;      // <- planNombre (ya camelCase)
  fechaInicio?: string;     // <- fechaInicio (ISO)
  fechaFin?: string;        // <- fechaFin (ISO)
  diasRestantes?: number;   // <- diasRestantes (puede ser < 0)
}

// --- 4.3 Clase (INT-4.3) -------------------------------------------------
export interface Clase {
  id: string;            // <- _id
  nombre: string;        // <- NOMBRE
  instructor: string;    // <- INSTRUCTOR
  diaSemana: DiaSemana;  // <- DIA_SEMANA (ya minúsculas)
  hora: string;          // <- HORA
  cupo: number;          // <- CUPO
  cupoOcupado: number;   // <- cupoOcupado
  cupoDisponible: number;// <- cupoDisponible
  proximoDictado: string;// <- proximoDictado (ISO)
  yaReservada?: boolean; // <- yaReservada (undefined si no se mandó dni)
}

// --- 4.3 Reserva (mis reservas + resultado de reservar/cancelar) ----------
export type EstadoReserva = 'reservada' | 'cancelada';

export interface Reserva {
  reservaId: string;          // <- reservaId
  claseId: string;            // <- claseId
  fecha: string;              // <- FECHA (ISO)
  estado: EstadoReserva;      // <- estado
  clase?: {                   // <- clase (puede ser null → omitir)
    nombre: string;           // <- NOMBRE
    instructor: string;       // <- INSTRUCTOR
    diaSemana: DiaSemana;     // <- DIA_SEMANA
    hora: string;             // <- HORA
  };
}

// Resultado liviano de las mutations reservar/cancelar (no se persiste; UI/toast).
export interface ReservaResultado {
  reservaId?: string;         // presente solo en reservar
  estado: EstadoReserva;      // "reservada" | "cancelada"
}

// --- 4.4 Anuncio (INT-4.4) -----------------------------------------------
export interface Anuncio {
  id: string;                // <- _id
  titulo: string;            // <- TITULO
  cuerpo: string;            // <- CUERPO
  fechaPublicacion: string;  // <- FECHA_PUBLICACION (ISO)
  audiencia: string;         // <- AUDIENCIA
}
