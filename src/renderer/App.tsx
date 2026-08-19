import styles from './App.module.css';
import {ConfigForm} from './modules/configForm/components/ConfigForm.js';
import {JenkinsDeployModal} from './modules/jenkinsDeployModal/components/JenkinsDeployModal.js';
import {PhaseControls} from './modules/releaseControls/components/PhaseControls.js';
import {ScriptConfigModal} from './modules/scriptConfig/components/ScriptConfigModal.js';
import {TerminalConsole} from './modules/terminalLog/components/TerminalConsole.js';

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
      <ScriptConfigModal />
      <JenkinsDeployModal />
    </div>
  );
};

export default App;
