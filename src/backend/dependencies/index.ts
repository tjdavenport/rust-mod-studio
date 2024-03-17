import log from '../log';
import { emitter, emitInstallError } from './events';
import { IpcMainEvent, ipcMain } from 'electron';
import * as steamCMD from './steamCMD';
import * as omniSharp from './omniSharp';
import * as oxideRust from './oxide.rust';
import * as rustDedicated from './rustDedicated';
import { DependencyEvent, DependencyName, OxideTags, ProcessStatusEvent } from '../../shared';

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
    try {
      if (!await dependency.isInstalled(app)) {
        await dependency.install(app);
      }
    } catch (error) {
      // catch and emit because there may be retry logic
      // in the future
      emitInstallError(dependency.name, error.message);
      throw error;
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
  ipcMain.handle('dependency-get-oxide-tags', async (): Promise<OxideTags> => {
    let latestAsset = '';
    let artifact = '';

    try {
      latestAsset = (await oxideRust.getLatestTaggedPlatformAsset()).tag;
    } catch (error) {
      log.error(error);
    }

    try {
      artifact = await oxideRust.getArtifactTag(app);
    } catch (error) {
      log.error(error);
    }

    return { latestAsset, artifact };
  });
  ipcMain.handle('dependency-stop-rust-dedicated', async () => {
    try {
      await rustDedicated.stop();
      return true;
    } catch (error) {
      log.error(error);
      return false;
    }
  });
  ipcMain.handle('dependency-get-status', (event: IpcMainEvent, name: DependencyName) => {
    if (name === DependencyName.RustDedicated) {
      return rustDedicated.status;
    }
    if (name === DependencyName.SteamCMD) {
      return 
    }
  });
  ipcMain.handle('dependency-start-rust-dedicated', async () => {
    /**
     * @TODO - it may be better to allow exceptions to throw. Investigate this approach more.
     */
    try {
      rustDedicated.start(app);

      if (rustDedicated.instance) {
        rustDedicated.instance.stdout.on('data', (data) => {
          emitter.emit('rust-dedicated-stdout', data);
        });
      }
      return true;
    } catch (error) {
      log.error(error);
      return false;
    }
  });
  ipcMain.handle('dependency-update-rust-dedicated', async () => {
    try {
      // Installing will update an existing install
      await rustDedicated.install(app);
      return true;
    } catch (error) {
      log.error(error);
      return false;
    }
  });
  ipcMain.handle('dependency-update-oxide', async () => {
    try {
      await oxideRust.deleteArtifact(app);
      await oxideRust.install(app);
      return true;
    } catch (error) {
      log.error(error);
      return false;
    }
  });
};

/**
 * @TODO - consider drying up event forwarding
 */
export const bindWindow = (browserWindow: Electron.BrowserWindow) => {
  const onRustDedicatedStdout = (data: Buffer) => {
    browserWindow.webContents.send('rust-dedicated-stdout', data.toString());
  };
  emitter.on('rust-dedicated-stdout', onRustDedicatedStdout);

  const onProgress = (event: DependencyEvent) => {
    browserWindow.webContents.send('dependency-progress', event);
  };
  emitter.on('progress', onProgress);

  const onError = (event: DependencyEvent) => {
    browserWindow.webContents.send('dependency-error', event);
  };
  emitter.on('error', onError);

  const onProcessStatusChange = (event: ProcessStatusEvent) => {
    browserWindow.webContents.send('dependency-process-status', event);
  };
  emitter.on('process-status', onProcessStatusChange);

  browserWindow.on('close', () => {
    emitter.off('rust-dedicated-stdout', onRustDedicatedStdout);
    emitter.off('progress', onProgress);
    emitter.off('error', onError);
    emitter.off('process-status', onProcessStatusChange);
  });
};
