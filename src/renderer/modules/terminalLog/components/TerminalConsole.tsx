import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTerminalStore } from '../terminalStore.js';
import { t } from '../../../shared/i18n/i18n.js';
import styles from './TerminalConsole.module.css';

export const TerminalConsole = () => {
  const logs = useTerminalStore(useShallow((state) => state.logs));
  const addLog = useTerminalStore(useShallow((state) => state.addLog));
  const setMrUrls = useTerminalStore(useShallow((state) => state.setMrUrls));
  const mrListPhase1 = useTerminalStore(useShallow((state) => state.mrListPhase1));
  const mrListPhase3 = useTerminalStore(useShallow((state) => state.mrListPhase3));

  const bodyRef = useRef<HTMLDivElement>(null);

  const allMrs = [...mrListPhase1, ...mrListPhase3];

  useEffect(() => {
    if (window.api) {
      const unsubLog = window.api.onTerminalLog((log) => {
        addLog(log);
      });

      const unsubMrs = window.api.onMrUrls((payload) => {
        setMrUrls(payload.phase, payload.mrList);
      });

      return () => {
        unsubLog();
        unsubMrs();
      };
    }
  }, [addLog, setMrUrls]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  const renderLogText = (text: string) => {
    // Detect URLs and make them clickable
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noreferrer"
            className={styles.mrLink}
            onClick={(e) => {
              e.preventDefault();
              window.open(part, '_blank');
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span>{t('terminalTitle')}</span>
      </div>

      {allMrs.length > 0 && (
        <div className={styles.mrPanel}>
          <div className={styles.mrPanelHeader}>
            <span>🔀 {t('mrListTitle')} ({allMrs.length})</span>
          </div>
          <div className={styles.mrPanelList}>
            {allMrs.map((mr, idx) => (
              <div key={idx} className={styles.mrItem}>
                <span className={styles.mrRepoName}>[{mr.repoName || mr.projectId}]</span>
                <a
                  href={mr.url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.mrBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(mr.url, '_blank');
                  }}
                >
                  Abrir MR 🔗
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.body} ref={bodyRef}>
        {logs.map((entry, index) => (
          <div
            key={index}
            className={`${styles.logEntry} ${styles[entry.stream] || styles.stdout}`}
          >
            {renderLogText(entry.text)}
          </div>
        ))}
      </div>
    </div>
  );
};
