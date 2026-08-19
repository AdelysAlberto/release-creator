import {app, BrowserWindow, ipcMain} from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {JenkinsDeployPayload, ReleaseConfig} from '../types/global.d.ts';
import {createJenkinsService} from './modules/jenkins/jenkinsService.js';
import {createReleaseOrchestrator} from './modules/releaseEngine/releaseOrchestrator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '../..');

let mainWindow: BrowserWindow | null = null;
const orchestrator = createReleaseOrchestrator(baseDir);
const jenkinsService = createJenkinsService();

const getPreloadPath = () => {
  const mjsPath = path.join(__dirname, 'preload.mjs');
  if (fs.existsSync(mjsPath)) return mjsPath;
  return path.join(__dirname, 'preload.js');
};

const createWindow = () => {
  const preloadPath = getPreloadPath();
  console.log(`[MAIN] Cargando Preload Script desde: ${preloadPath}`);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Release Creator',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('release:start', async (_, config: ReleaseConfig) => {
    console.log('[MAIN] IPC Event release:start recibido con config:', config);
    return orchestrator.startPhase1(mainWindow, config);
  });

  ipcMain.handle('release:proceedPhase2', async () => {
    console.log('[MAIN] IPC Event release:proceedPhase2 recibido');
    return orchestrator.startPhase2(mainWindow);
  });

  ipcMain.handle('release:proceedPhase3', async () => {
    console.log('[MAIN] IPC Event release:proceedPhase3 recibido');
    return orchestrator.startPhase3(mainWindow);
  });

  ipcMain.handle('release:interrupt', async () => {
    console.log('[MAIN] IPC Event release:interrupt recibido');
    return orchestrator.interrupt(mainWindow);
  });

  ipcMain.handle('jenkins:deploy', async (_, payload: JenkinsDeployPayload) => {
    console.log('[MAIN] IPC Event jenkins:deploy recibido:', payload.branch, payload.environment);
    return jenkinsService.triggerDeploy(mainWindow, payload);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
