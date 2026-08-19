import {useShallow} from 'zustand/react/shallow';
import {t} from '../../../shared/i18n/i18n.js';
import {useScriptConfigStore} from '../../scriptConfig/scriptConfigStore.js';
import {useConfigStore} from '../configStore.js';
import styles from './ConfigForm.module.css';
import {DependencyTable} from './DependencyTable.js';

export const ConfigForm = () => {
  const gitlabUrl = useConfigStore(useShallow((state) => state.gitlabUrl));
  const gitlabToken = useConfigStore(useShallow((state) => state.gitlabToken));
  const projectIdsRaw = useConfigStore(useShallow((state) => state.projectIdsRaw));
  const releaseVersion = useConfigStore(useShallow((state) => state.releaseVersion));

  const setGitlabUrl = useConfigStore(useShallow((state) => state.setGitlabUrl));
  const setGitlabToken = useConfigStore(useShallow((state) => state.setGitlabToken));
  const setProjectIdsRaw = useConfigStore(useShallow((state) => state.setProjectIdsRaw));
  const setReleaseVersion = useConfigStore(useShallow((state) => state.setReleaseVersion));

  const openModal = useScriptConfigStore(useShallow((s) => s.openModal));

  return (
    <div className={styles.container}>
      <div className={styles.formHeader}>
        <button type="button" className={styles.btnScriptConfig} onClick={openModal}>
          ⚙ {t('btnScriptConfig')}
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>{t('gitlabProjectIds')}</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={projectIdsRaw}
          placeholder={t('gitlabProjectIdsPlaceholder')}
          onChange={(e) => setProjectIdsRaw(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>{t('dependencyTableTitle')}</label>
        <DependencyTable />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>{t('releaseVersion')}</label>
        <input
          type="text"
          className={styles.input}
          value={releaseVersion}
          placeholder={t('releaseVersionPlaceholder')}
          onChange={(e) => setReleaseVersion(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>{t('configUrlGitlab')}</label>
        <input
          type="text"
          className={styles.input}
          value={gitlabUrl}
          placeholder={t('configUrlGitlabPlaceholder')}
          onChange={(e) => setGitlabUrl(e.target.value)}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>{t('configTokenGitlab')}</label>
        <input
          type="password"
          className={styles.input}
          value={gitlabToken}
          placeholder={t('configTokenGitlabPlaceholder')}
          onChange={(e) => setGitlabToken(e.target.value)}
        />
      </div>
    </div>
  );
};
