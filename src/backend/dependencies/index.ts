import { ipcMain } from 'electron';
import omniSharp from './omniSharp';
import { DependencyState } from '../../shared';

const bindIpcMain = () => {
  ipcMain.handle('deps-get-state', async (event) => {
    const state: DependencyState = [];

    state.push({
      name: omniSharp.readableName,
      installed: await omniSharp.isInstalled(),
      running: omniSharp.isRunning(),
    });

    return state;
  });
};

const bindWindow = (browserWindow: Electron.BrowserWindow) => {

};

export {
  bindIpcMain,
  omniSharp
};
