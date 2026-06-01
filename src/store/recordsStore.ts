import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from './storage';
import { syncQueue } from '../services/syncQueue';
import { Record, PersonalRecord } from '../types';

interface RecordsState {
  records: Record[];
  personalRecords: Map<string, PersonalRecord>;
  isLoading: boolean;

  // Actions
  setRecords: (records: Record[]) => void;
  addRecord: (record: Record) => void;
  updateRecord: (recordId: string, updates: Partial<Record>) => void;
  deleteRecord: (recordId: string) => void;
  setLoading: (loading: boolean) => void;

  // PR Actions
  checkAndUpdatePR: (ejercicioId: string, ejercicioNombre: string, peso: number, reps: number) => boolean;
  getPR: (ejercicioId: string) => PersonalRecord | undefined;
}

const generarId = () => Math.random().toString(36).substring(2, 9);

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set, get) => ({
      records: [],
      personalRecords: new Map(),
      isLoading: false,

      setRecords: (records) => {
        // Calcular PRs de los records existentes
        const prs = new Map<string, PersonalRecord>();

        records.forEach((record) => {
          const existingPR = prs.get(record.ejercicioId);

          if (!existingPR || record.peso > existingPR.pesoActual) {
            prs.set(record.ejercicioId, {
              ejercicioId: record.ejercicioId,
              ejercicioNombre: record.ejercicioNombre,
              pesoActual: record.peso,
              pesoAnterior: existingPR?.pesoActual,
              repsActual: record.reps,
              fechaActual: record.fecha,
              fechaAnterior: existingPR?.fechaActual,
              historial: [
                ...(existingPR?.historial || []),
                { peso: record.peso, reps: record.reps, fecha: record.fecha },
              ],
            });
          }
        });

        set({ records, personalRecords: prs });
      },

      addRecord: (record) =>
        set((state) => ({
          records: [...state.records, record],
        })),

      updateRecord: (recordId, updates) =>
        set((state) => ({
          records: state.records.map((r) =>
            r.id === recordId || r._id === recordId ? { ...r, ...updates } : r
          ),
        })),

      deleteRecord: (recordId) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== recordId && r._id !== recordId),
        })),

      setLoading: (isLoading) => set({ isLoading }),

      checkAndUpdatePR: (ejercicioId, ejercicioNombre, peso, reps) => {
        const { personalRecords, addRecord } = get();
        const existingPR = personalRecords.get(ejercicioId);

        const esNuevoRecord = !existingPR || peso > existingPR.pesoActual;

        if (esNuevoRecord) {
          const nuevoRecord: Record = {
            id: generarId(),
            dni: '',
            ejercicioId,
            ejercicioNombre,
            peso,
            reps,
            fecha: new Date().toISOString(),
            // Este record SOLO se crea cuando esNuevoRecord es true → es un PR.
            // Sin esto, recordToBatchItem lo subía con ES_RECORD=false.
            esRecord: true,
          };

          addRecord(nuevoRecord);

          // Offline-first (CONTRACT c.3): al detectar un PR, encolar el record para
          // subir. clientId = id local ya generado. Síncrono y no bloqueante; el
          // flush sube cuando hay red (o reintenta con backoff). El DNI lo resuelve
          // la cola desde el userStore (el record nace con dni '').
          syncQueue.enqueueRecord(nuevoRecord);

          const nuevoPR: PersonalRecord = {
            ejercicioId,
            ejercicioNombre,
            pesoActual: peso,
            pesoAnterior: existingPR?.pesoActual,
            repsActual: reps,
            fechaActual: nuevoRecord.fecha,
            fechaAnterior: existingPR?.fechaActual,
            historial: [
              ...(existingPR?.historial || []),
              { peso, reps, fecha: nuevoRecord.fecha },
            ],
          };

          set((state) => {
            const newPRs = new Map(state.personalRecords);
            newPRs.set(ejercicioId, nuevoPR);
            return { personalRecords: newPRs };
          });
        }

        return esNuevoRecord;
      },

      getPR: (ejercicioId) => {
        return get().personalRecords.get(ejercicioId);
      },
    }),
    {
      name: 'limefit-records-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        records: state.records,
      }),
      onRehydrateStorage: () => (state) => {
        // Reconstruir personalRecords después de rehidratar
        if (state) {
          const prs = new Map<string, PersonalRecord>();
          state.records.forEach((record) => {
            const existingPR = prs.get(record.ejercicioId);
            if (!existingPR || record.peso > existingPR.pesoActual) {
              prs.set(record.ejercicioId, {
                ejercicioId: record.ejercicioId,
                ejercicioNombre: record.ejercicioNombre,
                pesoActual: record.peso,
                pesoAnterior: existingPR?.pesoActual,
                repsActual: record.reps,
                fechaActual: record.fecha,
                fechaAnterior: existingPR?.fechaActual,
                historial: [
                  ...(existingPR?.historial || []),
                  { peso: record.peso, reps: record.reps, fecha: record.fecha },
                ],
              });
            }
          });
          state.personalRecords = prs;
        }
      },
    }
  )
);

// Selectores
export const useRecords = () => useRecordsStore((state) => state.records);
export const usePersonalRecords = () => useRecordsStore((state) => state.personalRecords);
export const useRecordByEjercicio = (ejercicioId: string) =>
  useRecordsStore((state) => state.personalRecords.get(ejercicioId));
