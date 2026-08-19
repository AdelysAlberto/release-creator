import {useEffect, useState} from 'react';
import {useShallow} from 'zustand/react/shallow';
import type {JenkinsConfig, ScriptConfig} from '../../../../types/global.d.ts';
import {t} from '../../../shared/i18n/i18n.js';
import {useScriptConfigStore} from '../scriptConfigStore.js';
import styles from './ScriptConfigModal.module.css';

type ActiveTab = 'scripts' | 'jenkins';

export const ScriptConfigModal = () => {
  const isOpen = useScriptConfigStore(useShallow((s) => s.isModalOpen));
  const savedScript = useScriptConfigStore(
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
  const savedJenkins = useScriptConfigStore(
    useShallow(
      (s): JenkinsConfig => ({
        jenkinsUrl: s.jenkinsUrl,
        jenkinsUser: s.jenkinsUser,
        jenkinsToken: s.jenkinsToken,
        jenkinsJob: s.jenkinsJob,
      })
    )
  );
  const closeModal = useScriptConfigStore(useShallow((s) => s.closeModal));
  const saveConfig = useScriptConfigStore(useShallow((s) => s.saveConfig));
  const saveJenkinsConfig = useScriptConfigStore(useShallow((s) => s.saveJenkinsConfig));

  const [activeTab, setActiveTab] = useState<ActiveTab>('scripts');
  const [scriptDraft, setScriptDraft] = useState<ScriptConfig>(savedScript);
  const [jenkinsDraft, setJenkinsDraft] = useState<JenkinsConfig>(savedJenkins);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('scripts');
      setScriptDraft(savedScript);
      setJenkinsDraft(savedJenkins);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const setScriptField = <K extends keyof ScriptConfig>(field: K, value: ScriptConfig[K]) => {
    setScriptDraft((prev) => ({...prev, [field]: value}));
  };

  const setJenkinsField = <K extends keyof JenkinsConfig>(field: K, value: JenkinsConfig[K]) => {
    setJenkinsDraft((prev) => ({...prev, [field]: value}));
  };

  const handleSave = () => {
    saveConfig(scriptDraft);
    saveJenkinsConfig(jenkinsDraft);
    closeModal();
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t('scriptConfigTitle')}>
      <div className={styles.modal}>
        <h2 className={styles.title}>{t('scriptConfigTitle')}</h2>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scripts'}
            className={activeTab === 'scripts' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('scripts')}
          >
            {t('tabScripts')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'jenkins'}
            className={activeTab === 'jenkins' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('jenkins')}
          >
            {t('tabJenkins')}
          </button>
        </div>

        {activeTab === 'scripts' && (
          <>
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('scriptConfigLibrarySection')}</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={scriptDraft.libraryRequiresDeployFirst}
                  onChange={(e) => setScriptField('libraryRequiresDeployFirst', e.target.checked)}
                />
                {t('scriptConfigLibraryDeployFirst')}
              </label>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('scriptConfigLibraryBuild')}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={scriptDraft.libraryBuildScript}
                  onChange={(e) => setScriptField('libraryBuildScript', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('scriptConfigLibraryPublish')}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={scriptDraft.libraryPublishScript}
                  onChange={(e) => setScriptField('libraryPublishScript', e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('scriptConfigSnapshotPublish')}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={scriptDraft.snapshotPublishScript}
                  onChange={(e) => setScriptField('snapshotPublishScript', e.target.value)}
                />
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('scriptConfigProjectSection')}</h3>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>{t('scriptConfigProjectBuild')}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={scriptDraft.projectBuildScript}
                  onChange={(e) => setScriptField('projectBuildScript', e.target.value)}
                />
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('scriptConfigSnapshotSection')}</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={scriptDraft.snapshotEnabled}
                  onChange={(e) => setScriptField('snapshotEnabled', e.target.checked)}
                />
                {t('scriptConfigSnapshotEnabled')}
              </label>
            </section>

            <p className={styles.warning}>{t('scriptConfigWarning')}</p>
          </>
        )}

        {activeTab === 'jenkins' && (
          <section className={styles.section}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>{t('jenkinsUrl')}</label>
              <input
                type="text"
                className={styles.input}
                value={jenkinsDraft.jenkinsUrl}
                onChange={(e) => setJenkinsField('jenkinsUrl', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>{t('jenkinsUser')}</label>
              <input
                type="text"
                className={styles.input}
                value={jenkinsDraft.jenkinsUser}
                onChange={(e) => setJenkinsField('jenkinsUser', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>{t('jenkinsToken')}</label>
              <input
                type="password"
                className={styles.input}
                value={jenkinsDraft.jenkinsToken}
                onChange={(e) => setJenkinsField('jenkinsToken', e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>{t('jenkinsJob')}</label>
              <input
                type="text"
                className={styles.input}
                value={jenkinsDraft.jenkinsJob}
                onChange={(e) => setJenkinsField('jenkinsJob', e.target.value)}
              />
            </div>
          </section>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={closeModal}>
            {t('btnCancel')}
          </button>
          <button type="button" className={styles.btnSave} onClick={handleSave}>
            {t('btnSave')}
          </button>
        </div>
      </div>
    </div>
  );
};

