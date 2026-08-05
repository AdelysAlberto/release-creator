import { create } from 'zustand';
import type { DependencyRelation } from '../../../types/global.d.ts';

export interface ConfigState {
  gitlabUrl: string;
  gitlabToken: string;
  projectIdsRaw: string;
  releaseVersion: string;
  dependencies: DependencyRelation[];
  setGitlabUrl: (url: string) => void;
  setGitlabToken: (token: string) => void;
  setProjectIdsRaw: (raw: string) => void;
  setReleaseVersion: (version: string) => void;
  addDependencyRow: () => void;
  removeDependencyRow: (id: string) => void;
  updateDependencyRow: (id: string, field: 'projectId' | 'libraryId', value: string) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  gitlabUrl: 'http://bos-gitlab.sicemadrid.com',
  gitlabToken: '',
  projectIdsRaw: `core/arquitectura-front/sice-front-components
cebor/bis/bis-private
cebor/bis/bis-landing
cebor/bis/bis-public`,
  releaseVersion: '2.0.0',
  dependencies: [
    {
      id: '1',
      projectId: 'cebor/bis/bis-private',
      libraryId: 'core/arquitectura-front/sice-front-components',
    },
  ],
  setGitlabUrl: (gitlabUrl) => set({ gitlabUrl }),
  setGitlabToken: (gitlabToken) => set({ gitlabToken }),
  setProjectIdsRaw: (projectIdsRaw) => set({ projectIdsRaw }),
  setReleaseVersion: (releaseVersion) => set({ releaseVersion }),
  addDependencyRow: () =>
    set((state) => ({
      dependencies: [
        ...state.dependencies,
        { id: String(Date.now()), projectId: '', libraryId: '' },
      ],
    })),
  removeDependencyRow: (id) =>
    set((state) => ({
      dependencies: state.dependencies.filter((item) => item.id !== id),
    })),
  updateDependencyRow: (id, field, value) =>
    set((state) => ({
      dependencies: state.dependencies.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    })),
}));
