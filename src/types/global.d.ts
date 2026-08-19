export interface DependencyRelation {
  id: string;
  projectId: string;
  libraryId: string;
}

export interface ScriptConfig {
  libraryRequiresDeployFirst: boolean;
  libraryBuildScript: string;
  libraryPublishScript: string;
  snapshotPublishScript: string;
  projectBuildScript: string;
  snapshotEnabled: boolean;
}

export interface JenkinsConfig {
  jenkinsUrl: string;
  jenkinsUser: string;
  jenkinsToken: string;
  jenkinsJob: string;
}

export interface JenkinsDeployPayload {
  branch: string;
  environment: string;
  jenkinsUrl: string;
  jenkinsUser: string;
  jenkinsToken: string;
  jenkinsJob: string;
}

export interface JenkinsBuildResult {
  ok: boolean;
  result?: string;
  buildUrl?: string;
  error?: string;
}

export interface ReleaseConfig {
  gitlabUrl: string;
  gitlabToken?: string;
  projectIds: string[];
  dependencies: DependencyRelation[];
  releaseVersion: string;
  scriptConfig: ScriptConfig;
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
  proceedPhase2: (config: ReleaseConfig) => Promise<{ ok: boolean; error?: string }>;
  proceedPhase3: (config: ReleaseConfig) => Promise<{ ok: boolean; error?: string }>;
  interruptRelease: () => Promise<{ ok: boolean; error?: string }>;
  triggerJenkinsDeploy: (payload: JenkinsDeployPayload) => Promise<JenkinsBuildResult>;
  onTerminalLog: (callback: (log: LogEntry) => void) => () => void;
  onStatusChange: (callback: (status: StatusPayload) => void) => () => void;
  onMrUrls: (callback: (payload: MrUrlsPayload) => void) => () => void;
}

declare global {
  interface Window {
    api: ApiBridge;
  }
}
