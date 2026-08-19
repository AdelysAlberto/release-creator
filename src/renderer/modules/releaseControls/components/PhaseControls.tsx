import {useEffect, useState} from 'react';
import {useShallow} from 'zustand/react/shallow';
import type {ReleaseConfig, ScriptConfig} from '../../../../types/global.d.ts';
import {t} from '../../../shared/i18n/i18n.js';
import {useConfigStore} from '../../configForm/configStore.js';
import {useJenkinsDeployStore} from '../../jenkinsDeployModal/jenkinsDeployStore.js';
import {useScriptConfigStore} from '../../scriptConfig/scriptConfigStore.js';
import {useTerminalStore} from '../../terminalLog/terminalStore.js';
import {useReleaseStore} from '../releaseStore.js';
import styles from './PhaseControls.module.css';

export const PhaseControls = () => {
  const currentPhase = useReleaseStore(useShallow((state) => state.currentPhase));
  const status = useReleaseStore(useShallow((state) => state.status));
  const setStatus = useReleaseStore(useShallow((state) => state.setStatus));

  const [selectedPhase, setSelectedPhase] = useState<1 | 2 | 3>(currentPhase);

  const gitlabUrl = useConfigStore(useShallow((state) => state.gitlabUrl));
  const gitlabToken = useConfigStore(useShallow((state) => state.gitlabToken));
  const projectIdsRaw = useConfigStore(useShallow((state) => state.projectIdsRaw));
  const releaseVersion = useConfigStore(useShallow((state) => state.releaseVersion));
  const dependencies = useConfigStore(useShallow((state) => state.dependencies));

  const clearLogs = useTerminalStore(useShallow((state) => state.clearLogs));

  const openJenkinsModal = useJenkinsDeployStore(useShallow((s) => s.openModal));

  const scriptConfig = useScriptConfigStore(
    useShallow(
      (s): ScriptConfig => ({
        libraryRequiresDeployFirst: s.libraryRequiresDeployFirst,
        libraryBuildScript: s.libraryBuildScript,
        libraryPublishScript: s.libraryPublishScript,
        snapshotPublishScript: s.snapshotPublishScript,
        projectBuildScript: s.projectBuildScript,
        snapshotEnabled: s.snapshotEnabled,
      })
    )
  );

  useEffect(() => {
    setSelectedPhase(currentPhase);
  }, [currentPhase]);

  useEffect(() => {
    if (window.api) {
      const unsub = window.api.onStatusChange((payload) => {
        setStatus(payload);
      });
      return () => unsub();
    }
  }, [setStatus]);

  const buildConfig = (): ReleaseConfig => {
    const projectIds = projectIdsRaw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return {
      gitlabUrl,
      gitlabToken,
      projectIds,
      dependencies,
      releaseVersion,
      scriptConfig,
    };
  };

  const handleExecutePhase = async (targetPhase: 1 | 2 | 3) => {
    if (!window.api) return;

    if (targetPhase === 1) {
      clearLogs();
      await window.api.startRelease(buildConfig());
    } else if (targetPhase === 2) {
      await window.api.proceedPhase2();
    } else if (targetPhase === 3) {
      await window.api.proceedPhase3();
    }
  };

  const handleProceedPhase2 = async () => {
    if (!window.api) return;
    await window.api.proceedPhase2();
  };

  const handleProceedPhase3 = async () => {
    if (!window.api) return;
    await window.api.proceedPhase3();
  };

  const handleInterrupt = async () => {
    if (window.api) {
      await window.api.interruptRelease();
    }
  };

  const isRunning = status === 'running';

  return (
    <div className={styles.container}>
      <div className={styles.phaseSelectorGroup}>
        <label className={styles.label}>Seleccionar Etapa de Trabajo:</label>
        <select
          className={styles.phaseSelect}
          value={selectedPhase}
          disabled={isRunning}
          onChange={(e) => setSelectedPhase(Number(e.target.value) as 1 | 2 | 3)}
        >
          <option value={1}>Etapa 1: MRs de Release & Publicación</option>
          <option value={2}>Etapa 2: Creación de Ramas de Release</option>
          <option value={3}>Etapa 3: Bumping a nuevo Sprint (SNAPSHOT)</option>
        </select>
      </div>

      {status === 'waiting_user' && currentPhase === 1 && (
        <button
          type="button"
          className={styles.btnProceed}
          onClick={handleProceedPhase2}
          disabled={isRunning}
        >
          Continuar 2da Fase (Crear Ramas)
        </button>
      )}

      {status === 'waiting_user' && currentPhase === 2 && (
        <button
          type="button"
          className={styles.btnProceed}
          onClick={handleProceedPhase3}
          disabled={isRunning}
        >
          Continuar 3era Etapa (Nuevo Sprint)
        </button>
      )}

      <div className={styles.buttonRow}>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={isRunning}
          onClick={() => handleExecutePhase(selectedPhase)}
        >
          {status === 'idle' ? `Iniciar Etapa ${selectedPhase}` : `Ejecutar Etapa ${selectedPhase}`}
        </button>

        <button
          type="button"
          className={styles.btnRetry}
          disabled={isRunning}
          onClick={() => handleExecutePhase(selectedPhase)}
          title="Reintentar la etapa seleccionada"
        >
          🔄 Reintentar
        </button>
      </div>
      <button
        type="button"
        className={styles.btnDanger}
        disabled={status === 'idle' || status === 'interrupted'}
        onClick={handleInterrupt}
      >
        Interrumpir
      </button>

      <br />
      <button
        type="button"
        className={styles.btnJenkins}
        onClick={() => openJenkinsModal(releaseVersion)}
      >
        {t('btnJenkins')}
      </button>
    </div>
  );
};
