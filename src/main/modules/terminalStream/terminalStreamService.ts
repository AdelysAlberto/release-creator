import { BrowserWindow } from 'electron';
import type { LogEntry } from '../../../types/global.d.ts';

export const createTerminalStreamService = () => {
  const emitLog = (window: BrowserWindow | null, text: string, stream: 'stdout' | 'stderr' | 'system' = 'stdout') => {
    const entry: LogEntry = {
      stream,
      text,
      timestamp: Date.now(),
    };

    if (window && !window.isDestroyed()) {
      window.webContents.send('terminal:log', entry);
    }
    console.log(`[${stream.toUpperCase()}] ${text}`);
  };

  return {
    emitLog,
  };
};
