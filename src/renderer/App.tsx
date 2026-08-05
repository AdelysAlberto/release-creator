import { TerminalConsole } from './modules/terminalLog/components/TerminalConsole.js';
import { ConfigForm } from './modules/configForm/components/ConfigForm.js';
import { PhaseControls } from './modules/releaseControls/components/PhaseControls.js';
import styles from './App.module.css';

export const App = () => {
  return (
    <div className={styles.appLayout}>
      <div className={styles.leftColumn}>
        <TerminalConsole />
      </div>
      <div className={styles.rightColumn}>
        <ConfigForm />
        <PhaseControls />
      </div>
    </div>
  );
};

export default App;
