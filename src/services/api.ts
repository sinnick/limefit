import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants/config';
import {
  ApiResponse,
  LoginResponse,
  RutinasResponse,
  RecordsResponse,
  User,
  Rutina,
  Record,
} from '../types';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logs de desarrollo
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
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
    return response.data.result_rutinas;
  },

  getById: async (id: string): Promise<Rutina> => {
    const response = await api.get<{ rutina: Rutina }>(`/rutinas/${id}`);
    return response.data.rutina;
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

// Records API
export const recordsApi = {
  getByUser: async (dni: string): Promise<Record[]> => {
    const response = await api.post<RecordsResponse>('/records/list', { dni });
    return response.data.result_records;
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
    return response.data.records;
  },
};

// Export default instance
export default api;
