import { useShallow } from 'zustand/react/shallow';
import { useConfigStore } from '../configStore.js';
import { t } from '../../../shared/i18n/i18n.js';
import styles from './DependencyTable.module.css';

export const DependencyTable = () => {
  const dependencies = useConfigStore(useShallow((state) => state.dependencies));
  const addDependencyRow = useConfigStore(useShallow((state) => state.addDependencyRow));
  const removeDependencyRow = useConfigStore(useShallow((state) => state.removeDependencyRow));
  const updateDependencyRow = useConfigStore(useShallow((state) => state.updateDependencyRow));

  return (
    <div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('colProjectId')}</th>
              <th>{t('colLibraryId')}</th>
              <th style={{ width: '32px' }}></th>
            </tr>
          </thead>
          <tbody>
            {dependencies.map((row) => (
              <tr key={row.id}>
                <td>
                  <input
                    type="text"
                    value={row.projectId}
                    placeholder="ej. 102"
                    onChange={(e) => updateDependencyRow(row.id, 'projectId', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.libraryId}
                    placeholder="ej. 101"
                    onChange={(e) => updateDependencyRow(row.id, 'libraryId', e.target.value)}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.btnRemove}
                    onClick={() => removeDependencyRow(row.id)}
                    title="Eliminar fila"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {dependencies.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '8px', color: '#aaaaaa' }}>
                  Sin dependencias declaradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className={styles.btnAdd} onClick={addDependencyRow}>
        {t('btnAdd')}
      </button>
    </div>
  );
};
