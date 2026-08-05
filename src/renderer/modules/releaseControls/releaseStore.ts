import { create } from 'zustand';
import type { StatusPayload } from '../../../types/global.d.ts';

export interface ReleaseState {
  currentPhase: 1 | 2 | 3;
  status: 'idle' | 'running' | 'waiting_user' | 'error' | 'success' | 'interrupted';
  message: string;
  setStatus: (payload: StatusPayload) => void;
}

export const useReleaseStore = create<ReleaseState>((set) => ({
  currentPhase: 1,
  status: 'idle',
  message: 'Listo para iniciar el proceso de release.',
  setStatus: (payload) =>
    set({
      currentPhase: payload.currentPhase,
      status: payload.status,
      message: payload.message,
    }),
}));
