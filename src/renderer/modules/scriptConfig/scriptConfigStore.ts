import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {JenkinsConfig, ScriptConfig} from '../../../types/global.d.ts';

export const DEFAULT_SCRIPT_CONFIG: ScriptConfig = {
  libraryRequiresDeployFirst: true,
  libraryBuildScript: 'pnpm build',
  libraryPublishScript: 'pnpm publish:prod',
  snapshotPublishScript: 'pnpm publish:snapshot',
  projectBuildScript: 'pnpm build',
  snapshotEnabled: true,
};

export const DEFAULT_JENKINS_CONFIG: JenkinsConfig = {
  jenkinsUrl: 'http://172.31.6.29:8080',
  jenkinsUser: '',
  jenkinsToken: '',
  jenkinsJob: 'deploy-bis-internal-portal-react',
};

interface ScriptConfigState extends ScriptConfig, JenkinsConfig {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  saveConfig: (cfg: ScriptConfig) => void;
  saveJenkinsConfig: (cfg: JenkinsConfig) => void;
}

export const useScriptConfigStore = create<ScriptConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_SCRIPT_CONFIG,
      ...DEFAULT_JENKINS_CONFIG,
      isModalOpen: false,
      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),
      saveConfig: (cfg) => set({ ...cfg }),
      saveJenkinsConfig: (cfg) => set({ ...cfg }),
    }),
    {
      name: 'script-config',
      // persist only config fields, not modal open/close state
      partialize: (state) => ({
        libraryRequiresDeployFirst: state.libraryRequiresDeployFirst,
        libraryBuildScript: state.libraryBuildScript,
        libraryPublishScript: state.libraryPublishScript,
        snapshotPublishScript: state.snapshotPublishScript,
        projectBuildScript: state.projectBuildScript,
        snapshotEnabled: state.snapshotEnabled,
        jenkinsUrl: state.jenkinsUrl,
        jenkinsUser: state.jenkinsUser,
        jenkinsToken: state.jenkinsToken,
        jenkinsJob: state.jenkinsJob,
      }),
    }
  )
);
