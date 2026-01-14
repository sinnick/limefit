import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/config';
import { authApi, rutinasApi, recordsApi } from './api';
import { useUserStore } from '../store/userStore';
import { useRutinasStore } from '../store/rutinasStore';
import { useRecordsStore } from '../store/recordsStore';
import { Rutina, Record } from '../types';

// ============ Auth Queries ============

export const useLogin = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);

  return useMutation({
    mutationFn: (dni: string) => {
      setLoading(true);
      return authApi.login(dni);
    },
    onSuccess: (user) => {
      setUser(user);
    },
    onError: () => {
      setLoading(false);
    },
  });
};

// ============ Rutinas Queries ============

export const useRutinasQuery = () => {
  const setRutinas = useRutinasStore((state) => state.setRutinas);

  return useQuery({
    queryKey: QUERY_KEYS.RUTINAS,
    queryFn: rutinasApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (antes cacheTime)
    refetchOnWindowFocus: false,
    select: (data) => {
      setRutinas(data);
      return data;
    },
  });
};

export const useRutinaQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RUTINA(id),
    queryFn: () => rutinasApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRutina = () => {
  const queryClient = useQueryClient();
  const addRutina = useRutinasStore((state) => state.addRutina);

  return useMutation({
    mutationFn: (rutina: Omit<Rutina, 'id'>) => rutinasApi.create(rutina),
    onSuccess: (newRutina) => {
      addRutina(newRutina);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUTINAS });
    },
  });
};

export const useUpdateRutina = () => {
  const queryClient = useQueryClient();
  const updateRutina = useRutinasStore((state) => state.updateRutina);

  return useMutation({
    mutationFn: ({ id, rutina }: { id: string; rutina: Partial<Rutina> }) =>
      rutinasApi.update(id, rutina),
    onSuccess: (updatedRutina) => {
      updateRutina(updatedRutina.id || updatedRutina._id || '', updatedRutina);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUTINAS });
    },
  });
};

export const useDeleteRutina = () => {
  const queryClient = useQueryClient();
  const deleteRutina = useRutinasStore((state) => state.deleteRutina);

  return useMutation({
    mutationFn: (id: string) => rutinasApi.delete(id),
    onSuccess: (_, id) => {
      deleteRutina(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RUTINAS });
    },
  });
};

// ============ Records Queries ============

export const useRecordsQuery = (dni: string) => {
  const setRecords = useRecordsStore((state) => state.setRecords);

  return useQuery({
    queryKey: QUERY_KEYS.RECORDS,
    queryFn: () => recordsApi.getByUser(dni),
    enabled: !!dni,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    select: (data) => {
      setRecords(data);
      return data;
    },
  });
};

export const useRecordsByEjercicio = (dni: string, ejercicioId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RECORD(ejercicioId),
    queryFn: () => recordsApi.getByEjercicio(dni, ejercicioId),
    enabled: !!dni && !!ejercicioId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  const addRecord = useRecordsStore((state) => state.addRecord);

  return useMutation({
    mutationFn: (record: Omit<Record, 'id'>) => recordsApi.create(record),
    onSuccess: (newRecord) => {
      addRecord(newRecord);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECORDS });
    },
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  const updateRecord = useRecordsStore((state) => state.updateRecord);

  return useMutation({
    mutationFn: ({ id, record }: { id: string; record: Partial<Record> }) =>
      recordsApi.update(id, record),
    onSuccess: (updatedRecord) => {
      updateRecord(updatedRecord.id || updatedRecord._id || '', updatedRecord);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECORDS });
    },
  });
};

export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  const deleteRecord = useRecordsStore((state) => state.deleteRecord);

  return useMutation({
    mutationFn: (id: string) => recordsApi.delete(id),
    onSuccess: (_, id) => {
      deleteRecord(id);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECORDS });
    },
  });
};
