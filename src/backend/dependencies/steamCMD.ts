import tar from 'tar';
import fsx from 'fs-extra';
import fetch from 'node-fetch';
import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import log, { logProcess } from '../log';
import { DependencyName } from '../../shared';
import { emitInstallError, emitInstallProgress } from './events';

const platformURL = new Map<string, string>();
platformURL.set(
  'darwin',
  'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz'
);

export const MSG_DOWNLOADING = 'Downloading SteamCMD';
export const MSG_EXTRACTING = 'Extracting SteamCMD';
export const MSG_INSTALLING = 'Installing SteamCMD';
export const MSG_FAILED_DOWNLOADING = 'Failed to download SteamCMD';
export const MSG_FAILED_EXTRACTING = 'Failed to extract SteamCMD';

export let instance: null | cp.ChildProcess = null;

export const getInstallPath = (app: Electron.App) => {
  return join(path.getRootDir(app), 'SteamCMD');
};

export const getStartFilename = () => {
  return 'steamcmd.sh';
};

const installArgs = () => {
  return ['+quit'];
};

export const start = (app: Electron.App, instanceArgs: string[]) => {
  if (instance !== null) {
    return;
  }

  const installPath = getInstallPath(app);

  instance = cp.spawn(
    './' + getStartFilename(),
    instanceArgs,
    {
      cwd: installPath,
    }
  );

  logProcess(instance);
  
  instance.on('exit', () => {
    instance = null;
  });
};

export const isInstalled = async (app: Electron.App) => {
  try {
    const installPath = getInstallPath(app);
    return await fsx.pathExists(join(installPath, getStartFilename()));
  } catch (error) {
    log.error(error);
    return false;
  }
};

export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    if (instance !== null) {
      return reject();
    }

    try {
      const installPath = getInstallPath(app);
      const downloadURL = platformURL.get(process.platform);
      const response = await fetch(downloadURL);
      emitInstallProgress(DependencyName.SteamCMD, MSG_DOWNLOADING);
      const emitResponseError = () => emitInstallError(DependencyName.SteamCMD, MSG_FAILED_DOWNLOADING);

      if (response.ok) {
        await fsx.ensureDir(installPath);
        const extractStream = tar.x({ cwd: installPath });

        response.body.pipe(extractStream);
        emitInstallProgress(DependencyName.SteamCMD, MSG_EXTRACTING);
        response.body.on('error', (error) => {
          emitResponseError();
          return reject(error);
        });

        extractStream.on('error', (error) => {
          emitInstallError(DependencyName.SteamCMD, MSG_FAILED_EXTRACTING);
          return reject(error);
        });
        extractStream.on('close', () => {
          // SteamCMD will update itself on the first start
          start(app, installArgs());
          emitInstallProgress(DependencyName.SteamCMD, MSG_INSTALLING)
          instance.on('exit', (code: number) => {
            if (code !== 0) {
              return reject(code);
            } else {
              return resolve();
            }
          });
        });
      } else {
        emitResponseError();
        return reject(new Error('download response not ok'));
      }

    } catch (error) {
      return reject(error);
    }
  });
};
