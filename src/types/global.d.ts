export interface DependencyRelation {
  id: string;
  projectId: string;
  libraryId: string;
}

export interface ReleaseConfig {
  gitlabUrl: string;
  gitlabToken?: string;
  projectIds: string[];
  dependencies: DependencyRelation[];
  releaseVersion: string;
}

export interface LogEntry {
  stream: 'stdout' | 'stderr' | 'system';
  text: string;
  timestamp: number;
}

export interface StatusPayload {
  currentPhase: 1 | 2 | 3;
  status: 'idle' | 'running' | 'waiting_user' | 'error' | 'success' | 'interrupted';
  message: string;
}

export interface MrUrlItem {
  projectId: string;
  repoName: string;
  url: string;
}

export interface MrUrlsPayload {
  phase: 1 | 3;
  mrList: MrUrlItem[];
}

export interface ApiBridge {
  startRelease: (config: ReleaseConfig) => Promise<{ ok: boolean; error?: string }>;
  proceedPhase2: () => Promise<{ ok: boolean; error?: string }>;
  proceedPhase3: () => Promise<{ ok: boolean; error?: string }>;
  interruptRelease: () => Promise<{ ok: boolean; error?: string }>;
  onTerminalLog: (callback: (log: LogEntry) => void) => () => void;
  onStatusChange: (callback: (status: StatusPayload) => void) => () => void;
  onMrUrls: (callback: (payload: MrUrlsPayload) => void) => () => void;
}

declare global {
  interface Window {
    api: ApiBridge;
  }
}
