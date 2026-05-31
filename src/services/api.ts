import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, TENANT_ID } from '../constants/config';
import {
  LoginResponse,
  RutinasResponse,
  RecordsResponse,
  User,
  Rutina,
  Record,
  WorkoutCompletado,
  DiaRutina,
  EjercicioEnRutina,
  DiaSemana,
  MetricaCorporal,
  MedidasCorporales,
  PerfilUpdate,
  EjercicioBiblioteca,
  Asistencia,
  MetodoCheckin,
} from '../types';

// ============================================================================
// Adaptador de Rutina — puente de naming entre backend y app (CONTRACT a.3).
//
// Backend (MAYÚSCULAS a nivel raíz, camelCase en subdocumentos anidados):
//   { _id, ID, NOMBRE, DESCRIPCION, DURACION, DIFICULTAD, NIVEL, HABILITADA,
//     DIAS: [{ diaId, nombre, orden, ejercicios: [{ ejercicioId, nombre, series,
//       repeticiones, descanso, peso (Number), unidadPeso, notas, orden }] }],
//     DIAS_SEMANA: [String], EJERCICIOS: [] (legacy),
//     FECHA_CREACION, FECHA_MODIFICACION, GYM_ID }
//
// App (camelCase): Rutina con dias[].ejercicios[].
//
// Este adaptador es la ÚNICA fuente de verdad de la traducción y es BIDIRECCIONAL:
//   adaptRutina      backend → app (detecta formato nuevo anidado vs. legacy)
//   toBackendRutina  app → backend (para POST/PUT)
// ============================================================================

// Backend → App: mapea un ejercicio anidado del nuevo formato (DIAS[].ejercicios[]).
const adaptEjercicio = (e: any): EjercicioEnRutina => {
  // En el formato nuevo el id estable lo da ejercicioId (ya no se fabrica).
  const ejercicioId: string = e?.ejercicioId ?? '';
  return {
    id: ejercicioId,
    ejercicioId,
    nombre: e?.nombre ?? '',
    sets: e?.series ?? 0,
    reps: e?.repeticiones ?? 0,
    // peso ya es Number en el backend nuevo; "" / null → undefined.
    peso: e?.peso != null && e.peso !== '' ? Number(e.peso) : undefined,
    unidadPeso: e?.unidadPeso ?? undefined,
    notas: e?.notas || undefined,
    descanso: e?.descanso,
    orden: e?.orden,
  };
};

// Backend → App (formato LEGACY): EJERCICIOS[] plano con peso String ("20kg").
// Se usa solo mientras la migración no corrió (DIAS array de strings + EJERCICIOS).
const adaptEjercicioLegacy = (id: string, e: any, i: number): EjercicioEnRutina => ({
  id: `${id}-ej-${i}`,
  ejercicioId: `${id}-ej-${i}`,
  nombre: e?.nombre ?? '',
  sets: e?.series ?? 0,
  reps: e?.repeticiones ?? 0,
  peso: e?.peso != null && e.peso !== '' ? parseFloat(String(e.peso)) || undefined : undefined,
  notas: e?.notas || undefined,
  descanso: e?.descanso,
  orden: i,
});

const adaptRutina = (r: any): Rutina => {
  // Si ya viene en formato de app (tiene dias[]), pasar tal cual (defensivo).
  if (!r || Array.isArray(r.dias)) return r as Rutina;

  const id: string = r._id ?? (r.ID != null ? String(r.ID) : '');

  // Detección de formato (CONTRACT a.3): el formato nuevo trae DIAS como array de
  // objetos (días-con-ejercicios). El legacy trae DIAS como array de strings
  // (nombres de día de la semana) + EJERCICIOS[] plano.
  const diasRaw = r.DIAS;
  const esFormatoNuevo =
    Array.isArray(diasRaw) && diasRaw.length > 0 && typeof diasRaw[0] === 'object';

  let dias: DiaRutina[];
  let diasSemana: DiaSemana[] | undefined;

  if (esFormatoNuevo) {
    // Mapeo directo: cada día con sus ejercicios anidados.
    dias = diasRaw.map((d: any) => ({
      id: d?.diaId ?? '',
      nombre: d?.nombre ?? '',
      orden: d?.orden,
      ejercicios: (d?.ejercicios ?? []).map(adaptEjercicio),
    }));
    // Los días de la semana viven en DIAS_SEMANA en el formato nuevo.
    diasSemana = Array.isArray(r.DIAS_SEMANA)
      ? (r.DIAS_SEMANA.map((d: any) => String(d).toLowerCase()) as DiaSemana[])
      : undefined;
  } else {
    // LEGACY: agrupar todo EJERCICIOS[] en un único día "Día 1".
    const ejercicios = (r.EJERCICIOS ?? []).map((e: any, i: number) =>
      adaptEjercicioLegacy(id, e, i)
    );
    dias = ejercicios.length > 0 ? [{ id: `${id}-dia-0`, nombre: 'Día 1', orden: 0, ejercicios }] : [];
    // En legacy los nombres de día de la semana viven en DIAS (array de strings).
    diasSemana = Array.isArray(diasRaw)
      ? (diasRaw.map((d: any) => String(d).toLowerCase()) as DiaSemana[])
      : undefined;
  }

  return {
    id,
    _id: r._id,
    nombre: r.NOMBRE ?? '',
    descripcion: r.DESCRIPCION || undefined,
    dias,
    diasSemana,
    tiempoEstimado: r.DURACION,
    createdAt: r.FECHA_CREACION,
    updatedAt: r.FECHA_MODIFICACION,
  };
};

// App → Backend (CONTRACT a.3): invierte adaptRutina para POST/PUT de rutinas.
// Respeta diaId/ejercicioId si vienen; si faltan, el backend los genera al guardar.
// (Nota: usamos un index signature inline porque el nombre `Record` está ocupado
//  por el tipo de dominio importado de ../types, no por el utility type de TS.)
const toBackendRutina = (rutina: Partial<Rutina>): { [k: string]: any } => {
  const out: { [k: string]: any } = {};

  if (rutina.nombre !== undefined) out.NOMBRE = rutina.nombre;
  if (rutina.descripcion !== undefined) out.DESCRIPCION = rutina.descripcion ?? '';
  if (rutina.tiempoEstimado !== undefined) out.DURACION = rutina.tiempoEstimado;

  if (rutina.dias !== undefined) {
    out.DIAS = (rutina.dias ?? []).map((d, di) => ({
      // Solo enviar diaId si ya existe (estable). Si falta, el backend lo genera.
      ...(d.id ? { diaId: d.id } : {}),
      nombre: d.nombre ?? `Día ${di + 1}`,
      orden: d.orden ?? di,
      ejercicios: (d.ejercicios ?? []).map((e, ei) => ({
        ...(e.ejercicioId ? { ejercicioId: e.ejercicioId } : {}),
        nombre: e.nombre ?? '',
        series: e.sets ?? 0,
        repeticiones: e.reps ?? 0,
        descanso: e.descanso ?? 60,
        peso: e.peso ?? null,
        unidadPeso: e.unidadPeso ?? 'kg',
        notas: e.notas ?? '',
        orden: e.orden ?? ei,
      })),
    }));
  }

  if (rutina.diasSemana !== undefined) {
    out.DIAS_SEMANA = (rutina.diasSemana ?? []).map((d) => String(d).toLowerCase());
  }

  return out;
};

// ============================================================================
// Instancia axios — base URL configurable (EXPO_PUBLIC_API_URL) + header X-Brand.
// ============================================================================
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    // Identificador de marca/tenant para el backend multi-tenant.
    'X-Brand': TENANT_ID,
  },
});

// Interceptor para logs de desarrollo
api.interceptors.request.use(
  (config) => {
    console.log(`[API][${TENANT_ID}] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response:`, response.status);
    return response;
  },
  (error: AxiosError) => {
    console.error('[API] Response Error:', error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API — login solo por DNI (CONTRACT b.1). Respuesta: { status, user }.
// ============================================================================
export const authApi = {
  login: async (dni: string): Promise<User | null> => {
    const response = await api.post<LoginResponse>('/login', { dni });
    return response.data.user;
  },
};

// ============================================================================
// Rutinas API
// ============================================================================
export const rutinasApi = {
  // CONTRACT b.2 — Mis rutinas asignadas: POST /mis-rutinas con { dni }.
  // Reemplaza al GET /rutinas para el flujo del socio (trae SOLO las asignadas).
  getMisRutinasAsignadas: async (dni: string): Promise<Rutina[]> => {
    const response = await api.post<RutinasResponse>('/mis-rutinas', { dni });
    return (response.data.result_rutinas ?? []).map(adaptRutina);
  },

  // Compat: GET /rutinas (todas las del gym). Se mantiene pero la app del socio
  // ya no lo usa para su flujo.
  getAll: async (): Promise<Rutina[]> => {
    const response = await api.get<RutinasResponse>('/rutinas');
    return (response.data.result_rutinas ?? []).map(adaptRutina);
  },

  getById: async (id: string): Promise<Rutina> => {
    const response = await api.get<{ rutina: any }>(`/rutinas/${id}`);
    return adaptRutina(response.data.rutina);
  },

  create: async (rutina: Omit<Rutina, 'id'>): Promise<Rutina> => {
    const response = await api.post<{ rutina: any }>('/rutinas', toBackendRutina(rutina));
    return adaptRutina(response.data.rutina);
  },

  update: async (id: string, rutina: Partial<Rutina>): Promise<Rutina> => {
    const response = await api.put<{ rutina: any }>(`/rutinas/${id}`, toBackendRutina(rutina));
    return adaptRutina(response.data.rutina);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/rutinas/${id}`);
  },
};

// ============================================================================
// Adaptador de Record — backend (MAYÚSCULAS) ↔ app (camelCase) (CONTRACT b.3).
// ============================================================================
const adaptRecord = (r: any): Record => {
  if (!r || r.ejercicioNombre !== undefined) return r as Record;
  const nombre = r.EJERCICIO ?? '';
  return {
    id: r._id ?? r.CLIENT_ID ?? `${r.DNI}-${nombre}-${r.FECHA}`,
    _id: r._id,
    clientId: r.CLIENT_ID || undefined,
    dni: r.DNI != null ? String(r.DNI) : '',
    ejercicioId: r.EJERCICIO_ID || nombre, // fallback al nombre si no hay id estable
    ejercicioNombre: nombre,
    peso: r.PESO ?? 0,
    reps: r.REPS ?? 0,
    fecha: r.FECHA ?? new Date().toISOString(),
    notas: r.NOTAS || undefined,
    esRecord: r.ES_RECORD ?? undefined,
  };
};

// App → request: un Record local al payload del batch de records (CONTRACT b.3).
// El clientId es la clave de idempotencia: usa record.clientId o, si falta, record.id.
const recordToBatchItem = (record: Record) => ({
  clientId: record.clientId ?? record.id,
  ejercicioId: record.ejercicioId,
  ejercicioNombre: record.ejercicioNombre,
  peso: record.peso,
  reps: record.reps,
  fecha: record.fecha,
  notas: record.notas ?? '',
  esRecord: record.esRecord ?? false,
});

// App → request: un WorkoutCompletado local al payload del batch de workouts
// (CONTRACT b.4). El clientId es el id ya generado por workoutStore.
const workoutToBatchItem = (workout: WorkoutCompletado) => ({
  clientId: workout.id,
  rutinaId: workout.rutinaId,
  rutinaNombre: workout.rutinaNombre,
  diaId: workout.diaId,
  diaNombre: workout.diaNombre,
  fecha: workout.fecha,
  duracion: workout.duracion,
  volumenTotal: workout.volumenTotal,
  prsLogrados: workout.prsLogrados,
  notas: workout.notas ?? '',
  ejercicios: workout.ejercicios.map((e) => ({
    ejercicioId: e.ejercicioId,
    nombre: e.nombre,
    setsObjetivo: e.setsObjetivo,
    repsObjetivo: e.repsObjetivo,
    pesoObjetivo: e.pesoObjetivo,
    completado: e.completado,
    setsCompletados: e.setsCompletados.map((s) => ({
      setNumero: s.setNumero,
      peso: s.peso,
      reps: s.reps,
      completado: s.completado,
      timestamp: s.timestamp,
      esRecord: s.esRecord ?? false,
      // Feature 2.3 (aditivo, backward-compatible): solo se incluyen si vienen.
      ...(s.rpe != null ? { rpe: s.rpe } : {}),
      ...(s.notas ? { notas: s.notas } : {}),
    })),
  })),
});

// Resultado por item del batch, alineado 1:1 por clientId (CONTRACT b.3/b.4).
export interface SyncBatchResult {
  clientId: string;
  ok: boolean;
  _id?: string;
  created?: boolean;
  error?: string;
}

interface SyncBatchResponse {
  status: string;
  results: SyncBatchResult[];
}

// ============================================================================
// Records API
// ============================================================================
export const recordsApi = {
  getByUser: async (dni: string): Promise<Record[]> => {
    const response = await api.post<RecordsResponse>('/records/list', { dni });
    return (response.data.result_records ?? []).map(adaptRecord);
  },

  getByEjercicio: async (dni: string, ejercicioId: string): Promise<Record[]> => {
    const response = await api.post<{ records: any[] }>('/records/ejercicio', {
      dni,
      ejercicioId,
    });
    return (response.data.records ?? []).map(adaptRecord);
  },

  // CONTRACT b.3 — Subir records en batch (idempotente por clientId).
  // Consume la cola de sync; reenviar el mismo lote NO duplica (upsert backend).
  subirRecords: async (dni: string, batch: Record[]): Promise<SyncBatchResult[]> => {
    const response = await api.post<SyncBatchResponse>('/records/batch', {
      dni,
      records: batch.map(recordToBatchItem),
    });
    return response.data.results ?? [];
  },
};

// ============================================================================
// Workouts API (CONTRACT b.4)
// ============================================================================
export const workoutsApi = {
  // Subir workouts completados en batch (idempotente por clientId).
  subirWorkouts: async (
    dni: string,
    batch: WorkoutCompletado[]
  ): Promise<SyncBatchResult[]> => {
    const response = await api.post<SyncBatchResponse>('/workouts/batch', {
      dni,
      workouts: batch.map(workoutToBatchItem),
    });
    return response.data.results ?? [];
  },
};

// ============================================================================
// Adaptador de MetricaCorporal — backend (MAYÚSCULAS) ↔ app (camelCase)
// (CONTRACT-fase1 §4.4). PESO→peso, PORCENTAJE_GRASA→porcentajeGrasa, etc.
// ============================================================================
const adaptMetrica = (m: any): MetricaCorporal => {
  // Si ya viene en formato de app (tiene `fecha` camelCase), pasar tal cual (defensivo).
  if (!m || m.fecha !== undefined) return m as MetricaCorporal;
  const medidasRaw = m.MEDIDAS ?? undefined;
  const medidas: MedidasCorporales | undefined = medidasRaw
    ? {
        pecho: medidasRaw.pecho,
        cintura: medidasRaw.cintura,
        cadera: medidasRaw.cadera,
        brazo: medidasRaw.brazo,
        muslo: medidasRaw.muslo,
      }
    : undefined;
  return {
    id: m._id ?? m.CLIENT_ID ?? `${m.DNI}-${m.FECHA}`,
    _id: m._id,
    clientId: m.CLIENT_ID || undefined,
    dni: m.DNI != null ? String(m.DNI) : '',
    fecha: m.FECHA ?? new Date().toISOString(),
    peso: m.PESO != null ? Number(m.PESO) : undefined,
    porcentajeGrasa: m.PORCENTAJE_GRASA != null ? Number(m.PORCENTAJE_GRASA) : undefined,
    medidas,
    notas: m.NOTAS || undefined,
  };
};

// App → request: una MetricaCorporal local al payload del batch de metrics.
// clientId = m.clientId ?? m.id (clave de idempotencia, igual que records).
const metricToBatchItem = (m: MetricaCorporal) => ({
  clientId: m.clientId ?? m.id,
  fecha: m.fecha,
  peso: m.peso,
  porcentajeGrasa: m.porcentajeGrasa,
  medidas: m.medidas ?? {},
  notas: m.notas ?? '',
});

// ============================================================================
// Métricas corporales API (CONTRACT-fase1 §2.2 / §4.4)
// ============================================================================
export const metricsApi = {
  // POST /metrics/list → MetricaCorporal[] (lee {metrics}).
  getByUser: async (dni: string): Promise<MetricaCorporal[]> => {
    const response = await api.post<{ metrics: any[] }>('/metrics/list', { dni });
    return (response.data.metrics ?? []).map(adaptMetrica);
  },

  // POST /metrics/batch → SyncBatchResult[] (idempotente por clientId, offline-first).
  subir: async (dni: string, batch: MetricaCorporal[]): Promise<SyncBatchResult[]> => {
    const response = await api.post<SyncBatchResponse>('/metrics/batch', {
      dni,
      metrics: batch.map(metricToBatchItem),
    });
    return response.data.results ?? [];
  },
};

// ============================================================================
// Adaptador de User — el endpoint de update de perfil devuelve {user} crudo del
// backend (MAYÚSCULAS); lo adaptamos al shape User existente ({DNI, NAME, FOTO?, email?}).
// ============================================================================
const adaptUser = (u: any): User => {
  if (!u) return u as User;
  // Si ya viene en formato app (tiene NAME y no NOMBRE), pasar tal cual (defensivo).
  if (u.NAME !== undefined && u.NOMBRE === undefined) return u as User;
  const nombre = [u.NOMBRE, u.APELLIDO].filter(Boolean).join(' ').trim();
  return {
    DNI: u.DNI != null ? String(u.DNI) : '',
    NAME: nombre || u.NAME || '',
    FOTO: u.FOTO || undefined,
    email: u.EMAIL || u.email || undefined,
    createdAt: u.createdAt ?? u.FECHA_CREACION,
  };
};

// App → request: PerfilUpdate camelCase. El backend mapea a MAYÚSCULAS y solo
// pisa los campos presentes (no envia undefined).
const profileToPayload = (dni: string, payload: PerfilUpdate): { [k: string]: any } => {
  const out: { [k: string]: any } = { dni };
  if (payload.nombre !== undefined) out.nombre = payload.nombre;
  if (payload.apellido !== undefined) out.apellido = payload.apellido;
  if (payload.email !== undefined) out.email = payload.email;
  if (payload.foto !== undefined) out.foto = payload.foto;
  if (payload.sexo !== undefined) out.sexo = payload.sexo;
  if (payload.pesoObjetivo !== undefined) out.pesoObjetivo = payload.pesoObjetivo;
  return out;
};

// ============================================================================
// Perfil API (CONTRACT-fase1 §2.3 / §4.4) — update del socio por DNI (sin auth).
// ============================================================================
export const profileApi = {
  update: async (dni: string, payload: PerfilUpdate): Promise<User> => {
    const response = await api.post<{ status: string; user: any }>(
      '/user/profile',
      profileToPayload(dni, payload)
    );
    return adaptUser(response.data.user);
  },
};

// ============================================================================
// Adaptador de EjercicioBiblioteca — backend (MAYÚSCULAS) ↔ app (camelCase)
// (CONTRACT-fase2 §1.1 / §2.1). El seed usa strings crudos en inglés.
// ============================================================================
const adaptEjercicioBiblioteca = (e: any): EjercicioBiblioteca => {
  // Si ya viene en formato de app (tiene `nombre` camelCase), pasar tal cual (defensivo).
  if (!e || e.nombre !== undefined) return e as EjercicioBiblioteca;
  return {
    id: e._id != null ? String(e._id) : '',
    nombre: e.NOMBRE ?? '',
    grupoMuscular: e.GRUPO_MUSCULAR ?? '',
    tipo: e.TIPO || undefined,
    equipo: e.EQUIPO || undefined,
    dificultad: e.DIFICULTAD || undefined,
    instrucciones: e.INSTRUCCIONES || undefined,
    imagen: e.URL_IMAGEN || undefined,
  };
};

export interface EjerciciosSearchParams {
  query?: string;
  grupoMuscular?: string;
  dificultad?: string;
  equipo?: string;
  limit?: number;
}

// ============================================================================
// Ejercicios (biblioteca) API (CONTRACT-fase2 §2.1) — lectura pública del gym.
// POST /ejercicios/search con filtros opcionales. No es offline-first.
// ============================================================================
export const ejerciciosApi = {
  // Búsqueda/listado con filtros. Devuelve la lista adaptada a camelCase.
  search: async (params: EjerciciosSearchParams = {}): Promise<EjercicioBiblioteca[]> => {
    const body: { [k: string]: any } = {};
    if (params.query !== undefined) body.query = params.query;
    if (params.grupoMuscular !== undefined) body.grupoMuscular = params.grupoMuscular;
    if (params.dificultad !== undefined) body.dificultad = params.dificultad;
    if (params.equipo !== undefined) body.equipo = params.equipo;
    if (params.limit !== undefined) body.limit = params.limit;

    const response = await api.post<{ status: string; ejercicios: any[]; total: number }>(
      '/ejercicios/search',
      body
    );
    return (response.data.ejercicios ?? []).map(adaptEjercicioBiblioteca);
  },

  // Detalle por id. No hay endpoint dedicado: se reusa search y se filtra por id.
  // (El detalle se navega con el ejercicioId; si la lista ya está cacheada, la
  // pantalla puede leerlo de ahí; este helper es el fallback de red.)
  getById: async (ejercicioId: string): Promise<EjercicioBiblioteca | null> => {
    const lista = await ejerciciosApi.search({ limit: 100 });
    return lista.find((e) => e.id === ejercicioId) ?? null;
  },
};

// ============================================================================
// Adaptador de Asistencia — backend (MAYÚSCULAS) ↔ app (camelCase)
// (CONTRACT-fase2 §1.3 / §2.5).
// ============================================================================
const adaptAsistencia = (a: any): Asistencia => {
  // Si ya viene en formato de app (tiene `metodo` camelCase), pasar tal cual (defensivo).
  if (!a || a.metodo !== undefined) return a as Asistencia;
  return {
    id: a._id ?? a.CLIENT_ID ?? `${a.DNI}-${a.FECHA}`,
    clientId: a.CLIENT_ID || undefined,
    dni: a.DNI != null ? String(a.DNI) : '',
    fecha: a.FECHA ?? new Date().toISOString(),
    horaCheckin: a.HORA_CHECKIN || undefined,
    metodo: (a.METODO ?? 'qr') as MetodoCheckin,
    notas: a.NOTAS || undefined,
  };
};

// Resultado del check-in idempotente (CONTRACT-fase2 §2.5): { ok, created }.
// Alineado con el patrón offline-first: created:false (ya existía hoy) = éxito.
export interface CheckinResult {
  clientId: string;
  ok: boolean;
  created?: boolean;
  asistencia?: Asistencia;
  error?: string;
}

// ============================================================================
// Asistencia API (CONTRACT-fase2 §2.5) — check-in offline-first idempotente por
// DNI+gym+día. La escritura del socio pasa por la cola de sync (type 'asistencia').
// ============================================================================
export const asistenciaApi = {
  // POST /asistencia/checkin. Idempotente por (GYM_ID, DNI, FECHA-día).
  // Devuelve un CheckinResult homogéneo con el resto de la cola (clientId, ok).
  checkIn: async (dni: string, asistencia: Asistencia): Promise<CheckinResult> => {
    const clientId = asistencia.clientId ?? asistencia.id;
    try {
      const response = await api.post<{ status: string; asistencia: any; created: boolean }>(
        '/asistencia/checkin',
        {
          dni,
          metodo: asistencia.metodo ?? 'qr',
          clientId,
          notas: asistencia.notas ?? '',
          fecha: asistencia.horaCheckin ?? asistencia.fecha,
        }
      );
      return {
        clientId,
        ok: response.data.status === 'ok',
        created: response.data.created,
        asistencia: response.data.asistencia
          ? adaptAsistencia(response.data.asistencia)
          : undefined,
      };
    } catch (err: any) {
      return { clientId, ok: false, error: err?.message ?? 'error de red' };
    }
  },

  // POST /asistencia/list → Asistencia[] (lee {asistencias}). Lectura por DNI.
  getHistorial: async (
    dni: string,
    rango?: { desde?: string; hasta?: string; limit?: number; skip?: number }
  ): Promise<Asistencia[]> => {
    const response = await api.post<{ status: string; asistencias: any[]; total: number }>(
      '/asistencia/list',
      { dni, ...(rango ?? {}) }
    );
    return (response.data.asistencias ?? []).map(adaptAsistencia);
  },
};

// Export del adaptador app→backend por si la UI admin lo necesita fuera de los
// helpers de rutinasApi (es el único puente de traducción, ver CONTRACT a.3).
export { toBackendRutina, adaptRutina };

// Export default instance
export default api;
