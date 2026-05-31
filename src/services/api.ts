import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL, TENANT_ID } from '../constants/config';
import {
  ApiResponse,
  LoginResponse,
  RutinasResponse,
  RecordsResponse,
  User,
  Rutina,
  Record,
  DiaRutina,
  EjercicioEnRutina,
  DiaSemana,
} from '../types';

// El backend usa un esquema plano en MAYÚSCULAS (NOMBRE, DESCRIPCION, DURACION,
// DIAS: [String] con nombres de día, EJERCICIOS: [{nombre,series,repeticiones,descanso,peso,notas}]).
// La app espera Rutina con dias[].ejercicios[] en camelCase. Este adaptador traduce.
// Es defensivo: si la respuesta ya viene en el formato de la app, la deja igual.
const adaptRutina = (r: any): Rutina => {
  if (!r || Array.isArray(r.dias)) return r as Rutina;

  const id: string = r._id ?? (r.ID != null ? String(r.ID) : '');

  const ejercicios: EjercicioEnRutina[] = (r.EJERCICIOS ?? []).map((e: any, i: number) => ({
    id: `${id}-ej-${i}`,
    ejercicioId: `${id}-ej-${i}`,
    nombre: e?.nombre ?? '',
    sets: e?.series ?? 0,
    reps: e?.repeticiones ?? 0,
    peso: e?.peso != null && e.peso !== '' ? parseFloat(String(e.peso)) || undefined : undefined,
    notas: e?.notas || undefined,
    descanso: e?.descanso,
  }));

  // El backend no separa ejercicios por día: agrupamos todos en un único día.
  const dias: DiaRutina[] =
    ejercicios.length > 0 ? [{ id: `${id}-dia-0`, nombre: 'Entrenamiento', ejercicios }] : [];

  return {
    id,
    _id: r._id,
    nombre: r.NOMBRE ?? '',
    descripcion: r.DESCRIPCION || undefined,
    dias,
    // DIAS (nombres de día de la semana) → diasSemana.
    diasSemana: Array.isArray(r.DIAS)
      ? (r.DIAS.map((d: any) => String(d).toLowerCase()) as DiaSemana[])
      : undefined,
    tiempoEstimado: r.DURACION,
    createdAt: r.FECHA_CREACION,
    updatedAt: r.FECHA_MODIFICACION,
  };
};

// Crear instancia de axios
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

// Auth API
export const authApi = {
  login: async (dni: string): Promise<User> => {
    const response = await api.post<LoginResponse>('/login', { dni });
    return response.data.user;
  },
};

// Rutinas API
export const rutinasApi = {
  getAll: async (): Promise<Rutina[]> => {
    const response = await api.get<RutinasResponse>('/rutinas');
    return (response.data.result_rutinas ?? []).map(adaptRutina);
  },

  getById: async (id: string): Promise<Rutina> => {
    const response = await api.get<{ rutina: Rutina }>(`/rutinas/${id}`);
    return adaptRutina(response.data.rutina);
  },

  create: async (rutina: Omit<Rutina, 'id'>): Promise<Rutina> => {
    const response = await api.post<{ rutina: Rutina }>('/rutinas', rutina);
    return response.data.rutina;
  },

  update: async (id: string, rutina: Partial<Rutina>): Promise<Rutina> => {
    const response = await api.put<{ rutina: Rutina }>(`/rutinas/${id}`, rutina);
    return response.data.rutina;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/rutinas/${id}`);
  },
};

// El backend devuelve records con campos en MAYÚSCULAS (DNI, EJERCICIO, PESO, FECHA)
// y sin reps/notas. La app espera { ejercicioNombre, ejercicioId, peso, reps, fecha, ... }.
const adaptRecord = (r: any): Record => {
  if (!r || r.ejercicioNombre !== undefined) return r as Record;
  const nombre = r.EJERCICIO ?? '';
  return {
    id: r._id ?? `${r.DNI}-${nombre}-${r.FECHA}`,
    _id: r._id,
    dni: r.DNI != null ? String(r.DNI) : '',
    ejercicioId: nombre, // el backend no tiene id de ejercicio; usamos el nombre
    ejercicioNombre: nombre,
    peso: r.PESO ?? 0,
    reps: r.REPS ?? 0, // el backend no guarda reps
    fecha: r.FECHA ?? new Date().toISOString(),
    notas: r.NOTAS || undefined,
  };
};

// Records API
export const recordsApi = {
  getByUser: async (dni: string): Promise<Record[]> => {
    const response = await api.post<RecordsResponse>('/records/list', { dni });
    return (response.data.result_records ?? []).map(adaptRecord);
  },

  create: async (record: Omit<Record, 'id'>): Promise<Record> => {
    const response = await api.post<{ record: Record }>('/records', record);
    return response.data.record;
  },

  update: async (id: string, record: Partial<Record>): Promise<Record> => {
    const response = await api.put<{ record: Record }>(`/records/${id}`, record);
    return response.data.record;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/records/${id}`);
  },

  getByEjercicio: async (dni: string, ejercicioId: string): Promise<Record[]> => {
    const response = await api.post<{ records: Record[] }>('/records/ejercicio', {
      dni,
      ejercicioId,
    });
    return (response.data.records ?? []).map(adaptRecord);
  },
};

// Export default instance
export default api;
