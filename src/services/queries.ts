import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/config';
import { authApi, rutinasApi, recordsApi } from './api';
import { useUserStore } from '../store/userStore';
import { useRutinasStore } from '../store/rutinasStore';
import { useRecordsStore } from '../store/recordsStore';
import { Rutina } from '../types';

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
      // El backend puede devolver user: null si el DNI no existe (CONTRACT b.1).
      if (user) setUser(user);
      else setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });
};

// ============ Rutinas Queries ============

// CONTRACT b.2 — el flujo del socio trae SOLO sus rutinas asignadas y activas
// vía POST /mis-rutinas con el DNI del usuario logueado (no todas las del gym).
// La firma sin args se mantiene para no romper los call sites (InicioScreen,
// RutinasScreen); el DNI se lee del userStore.
export const useRutinasQuery = () => {
  const setRutinas = useRutinasStore((state) => state.setRutinas);
  const dni = useUserStore((state) => state.user?.DNI) ?? '';

  const query = useQuery({
    queryKey: [...QUERY_KEYS.RUTINAS, dni],
    queryFn: () => rutinasApi.getMisRutinasAsignadas(dni),
    enabled: !!dni,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (antes cacheTime)
    refetchOnWindowFocus: false,
  });

  // Sincronizar al store en un efecto, NO en `select`: `select` corre durante el
  // render y llamar setRutinas ahí dispara "setState durante render" (rompía el
  // árbol de InicioScreen → pantalla negra al volver de un workout).
  useEffect(() => {
    if (query.data) setRutinas(query.data);
  }, [query.data, setRutinas]);

  return query;
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
//
// NOTA (CONTRACT b.3 / c): las ESCRITURAS de records y workouts ya NO pasan por
// React Query. Son offline-first: se guardan local (MMKV) y se suben con la cola
// de sync (syncStore) vía recordsApi.subirRecords / workoutsApi.subirWorkouts.
// Por eso acá quedan SOLO las LECTURAS. Las antiguas mutaciones de records
// (create/update/delete contra /records inexistente) se eliminaron.

export const useRecordsQuery = (dni: string) => {
  const setRecords = useRecordsStore((state) => state.setRecords);

  const query = useQuery({
    queryKey: [...QUERY_KEYS.RECORDS, dni],
    queryFn: () => recordsApi.getByUser(dni),
    enabled: !!dni,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Mismo motivo que en useRutinasQuery: el set al store va en efecto, no en `select`.
  useEffect(() => {
    if (query.data) setRecords(query.data);
  }, [query.data, setRecords]);

  return query;
};

export const useRecordsByEjercicio = (dni: string, ejercicioId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.RECORD(ejercicioId),
    queryFn: () => recordsApi.getByEjercicio(dni, ejercicioId),
    enabled: !!dni && !!ejercicioId,
    staleTime: 5 * 60 * 1000,
  });
};
