import {create} from 'zustand';

export type DeployTab = 'dev' | 'release' | 'qa';
export type DeployStatus = 'idle' | 'running' | 'success' | 'failure';

interface TabForm {
  branch: string;
  environment: string;
}

interface JenkinsDeployState {
  isModalOpen: boolean;
  activeTab: DeployTab;
  forms: Record<DeployTab, TabForm>;
  statuses: Record<DeployTab, DeployStatus>;
  openModal: (releaseVersion?: string) => void;
  closeModal: () => void;
  setActiveTab: (tab: DeployTab) => void;
  setFormField: (tab: DeployTab, field: keyof TabForm, value: string) => void;
  setStatus: (tab: DeployTab, status: DeployStatus) => void;
}

const DEFAULT_FORMS: Record<DeployTab, TabForm> = {
  dev: { branch: 'develop', environment: 'dev' },
  release: { branch: 'release/', environment: 'ci' },
  qa: { branch: 'develop', environment: 'qa' },
};

export const useJenkinsDeployStore = create<JenkinsDeployState>((set) => ({
  isModalOpen: false,
  activeTab: 'dev',
  forms: { ...DEFAULT_FORMS },
  statuses: { dev: 'idle', release: 'idle', qa: 'idle' },
  openModal: (releaseVersion) =>
    set((state) => ({
      isModalOpen: true,
      activeTab: 'dev',
      forms: {
        ...state.forms,
        release: {
          ...state.forms.release,
          branch: releaseVersion ? `release/${releaseVersion}` : state.forms.release.branch,
        },
      },
    })),
  closeModal: () => set({ isModalOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFormField: (tab, field, value) =>
    set((state) => ({
      forms: { ...state.forms, [tab]: { ...state.forms[tab], [field]: value } },
    })),
  setStatus: (tab, status) =>
    set((state) => ({ statuses: { ...state.statuses, [tab]: status } })),
}));
