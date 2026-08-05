import { create } from 'zustand';
import type { LogEntry, MrUrlItem } from '../../../types/global.d.ts';

export interface TerminalState {
  logs: LogEntry[];
  mrListPhase1: MrUrlItem[];
  mrListPhase3: MrUrlItem[];
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
  setMrUrls: (phase: 1 | 3, mrList: MrUrlItem[]) => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  logs: [
    {
      stream: 'system',
      text: 'Consola de terminal iniciada. Configure los parámetros a la derecha y presione "Comenzar".',
      timestamp: Date.now(),
    },
  ],
  mrListPhase1: [],
  mrListPhase3: [],
  addLog: (entry) => set((state) => ({ logs: [...state.logs, entry] })),
  clearLogs: () => set({ logs: [], mrListPhase1: [], mrListPhase3: [] }),
  setMrUrls: (phase, mrList) =>
    set(() =>
      phase === 1 ? { mrListPhase1: mrList } : { mrListPhase3: mrList }
    ),
}));
