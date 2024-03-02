import log from '../log';
import { emitter } from './events';
import { ipcMain } from 'electron';
import * as steamCMD from './steamCMD';
import * as omniSharp from './omniSharp';
import * as oxideRust from './oxide.rust';
import { DependencyEvent } from '../../shared';
import * as rustDedicated from './rustDedicated';

export const depsInstalled = async (app: Electron.App) => {
  const installedChecks = [
    await omniSharp.isInstalled(app),
    await steamCMD.isInstalled(app),
    await rustDedicated.isInstalled(app),
    await oxideRust.isInstalled(app),
  ];

  return !installedChecks.includes(false);
};

export const ensureInstalled = async (app: Electron.App) => {
  const dependencies = [
    omniSharp, steamCMD, rustDedicated, oxideRust
  ];

  for (const dependency of dependencies) {
    if (!await dependency.isInstalled(app)) {
      await dependency.install(app);
    }
  }
};

export const bindIpcMain = (app: Electron.App) => {
  ipcMain.handle('dependency-ensure-installed', async () => {
    try {
      await ensureInstalled(app);
      return true;
    } catch (error) {
      log.error(error);
      return false;
    }
  });
  ipcMain.handle('has-dotnet6', async () => {
    return await omniSharp.hasDotnet6();
  });
};

export const bindWindow = (browserWindow: Electron.BrowserWindow) => {
  const onProgress = (event: DependencyEvent) => {
    browserWindow.webContents.send('dependency-progress', event);
  };
  emitter.on('progress', onProgress);
  const onError = (event: DependencyEvent) => {
    browserWindow.webContents.send('dependency-error', event);
  };
  emitter.on('error', onError);

  browserWindow.on('close', () => {
    emitter.off('progress', onProgress);
    emitter.off('error', onError);
  });
};
