import {useShallow} from 'zustand/react/shallow';
import type {JenkinsDeployPayload} from '../../../../types/global.d.ts';
import {t} from '../../../shared/i18n/i18n.js';
import {useScriptConfigStore} from '../../scriptConfig/scriptConfigStore.js';
import {useJenkinsDeployStore, type DeployTab} from '../jenkinsDeployStore.js';
import styles from './JenkinsDeployModal.module.css';

export const JenkinsDeployModal = () => {
  const isOpen = useJenkinsDeployStore(useShallow((s) => s.isModalOpen));
  const activeTab = useJenkinsDeployStore(useShallow((s) => s.activeTab));
  const forms = useJenkinsDeployStore(useShallow((s) => s.forms));
  const closeModal = useJenkinsDeployStore(useShallow((s) => s.closeModal));
  const setActiveTab = useJenkinsDeployStore(useShallow((s) => s.setActiveTab));
  const setFormField = useJenkinsDeployStore(useShallow((s) => s.setFormField));

  const jenkinsUrl = useScriptConfigStore(useShallow((s) => s.jenkinsUrl));
  const jenkinsUser = useScriptConfigStore(useShallow((s) => s.jenkinsUser));
  const jenkinsToken = useScriptConfigStore(useShallow((s) => s.jenkinsToken));
  const jenkinsJob = useScriptConfigStore(useShallow((s) => s.jenkinsJob));

  if (!isOpen) return null;

  const currentForm = forms[activeTab];

  const handleDeploy = () => {
    if (!window.api) return;

    if (!jenkinsUrl || !jenkinsUser || !jenkinsToken || !jenkinsJob) {
      alert(t('jenkinsConfigMissing'));
      return;
    }

    const payload: JenkinsDeployPayload = {
      branch: currentForm.branch,
      environment: currentForm.environment,
      jenkinsUrl,
      jenkinsUser,
      jenkinsToken,
      jenkinsJob,
    };

    // fire-and-forget: logs stream to terminal, result visible in Jenkins
    window.api.triggerJenkinsDeploy(payload);
    closeModal();
  };

  const tabs: {id: DeployTab; label: string}[] = [
    {id: 'dev', label: t('jenkinsTabDev')},
    {id: 'release', label: t('jenkinsTabRelease')},
    {id: 'qa', label: t('jenkinsTabQA')},
  ];

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t('jenkinsDeployTitle')}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('jenkinsDeployTitle')}</h2>
          <span className={styles.jobName}>{jenkinsJob || '—'}</span>
        </div>

        <div className={styles.tabs} role="tablist">
          {tabs.map(({id, label}) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={activeTab === id ? styles.tabActive : styles.tab}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <section className={styles.section}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{t('jenkinsBranch')}</label>
            <input
              type="text"
              className={styles.input}
              value={currentForm.branch}
              onChange={(e) => setFormField(activeTab, 'branch', e.target.value)}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>{t('jenkinsEnvironment')}</label>
            <input
              type="text"
              className={styles.input}
              value={currentForm.environment}
              onChange={(e) => setFormField(activeTab, 'environment', e.target.value)}
            />
          </div>

        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.btnClose} onClick={closeModal}>
            {t('btnClose')}
          </button>
          <button type="button" className={styles.btnDeploy} onClick={handleDeploy}>
            🚀 {t('jenkinsDeploy')}
          </button>
        </div>
      </div>
    </div>
  );
};
