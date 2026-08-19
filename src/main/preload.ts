import {contextBridge, ipcRenderer} from 'electron';
import type {JenkinsDeployPayload, LogEntry, MrUrlsPayload, ReleaseConfig, StatusPayload} from '../types/global.d.ts';

const api = {
  startRelease: (config: ReleaseConfig) => ipcRenderer.invoke('release:start', config),
  proceedPhase2: (config: ReleaseConfig) => ipcRenderer.invoke('release:proceedPhase2', config),
  proceedPhase3: (config: ReleaseConfig) => ipcRenderer.invoke('release:proceedPhase3', config),
  interruptRelease: () => ipcRenderer.invoke('release:interrupt'),
  triggerJenkinsDeploy: (payload: JenkinsDeployPayload) => ipcRenderer.invoke('jenkins:deploy', payload),

  onTerminalLog: (callback: (log: LogEntry) => void) => {
    const listener = (_: unknown, data: LogEntry) => callback(data);
    ipcRenderer.on('terminal:log', listener);
    return () => ipcRenderer.removeListener('terminal:log', listener);
  },

  onStatusChange: (callback: (status: StatusPayload) => void) => {
    const listener = (_: unknown, data: StatusPayload) => callback(data);
    ipcRenderer.on('release:statusChange', listener);
    return () => ipcRenderer.removeListener('release:statusChange', listener);
  },

  onMrUrls: (callback: (payload: MrUrlsPayload) => void) => {
    const listener = (_: unknown, data: MrUrlsPayload) => callback(data);
    ipcRenderer.on('release:mrUrls', listener);
    return () => ipcRenderer.removeListener('release:mrUrls', listener);
  },
};

contextBridge.exposeInMainWorld('api', api);

