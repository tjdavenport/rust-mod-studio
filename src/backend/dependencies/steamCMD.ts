import tar from 'tar';
import fsx from 'fs-extra';
import * as path from '../path';
import { join } from 'node:path';
import decompress from 'decompress';
import * as cp from 'child_process';
import log, { logProcess } from '../log';
import { finished } from 'stream/promises';
import fetch, { Response } from 'node-fetch';
import { DependencyName } from '../../shared';
import { emitInstallError, emitInstallProgress } from './events';

const platformURL = new Map<string, string>();
platformURL.set(
  'darwin',
  'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz'
);
platformURL.set(
  'win32',
  'https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip'
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
  if (process.platform === 'darwin') {
    return 'steamcmd.sh';
  } else if (process.platform === 'win32') {
    return 'steamcmd.exe';
  }
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

const emitResponseError = () => emitInstallError(DependencyName.SteamCMD, MSG_FAILED_DOWNLOADING);
const extractWindows = async (installPath: string, response: Response, app: Electron.App) => {
  await fsx.ensureDir(path.artifactDir(app));

  const zipPath = join(path.artifactDir(app), 'steamcmd.zip');
  const writeZip = fsx.createWriteStream(zipPath, {
    flags: 'wx'
  });
  await finished(response.body.pipe(writeZip));
  emitInstallProgress(DependencyName.SteamCMD, MSG_EXTRACTING);
  await decompress(zipPath, installPath);
};
const extractOSX = async (installPath: string, response: Response) => {
  const extractStream = tar.x({ cwd: installPath });
  emitInstallProgress(DependencyName.SteamCMD, MSG_EXTRACTING);
  await finished(response.body.pipe(extractStream));
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

      if (response.ok) {
        await fsx.ensureDir(installPath);

        if (process.platform === 'win32') {
          await extractWindows(installPath, response, app);
        } else if (process.platform === 'darwin') {
          await extractOSX(installPath, response);
        }

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
      } else {
        emitResponseError();
        return reject(new Error('download response not ok'));
      }
    } catch (error) {
      emitResponseError();
      return reject(error);
    }
  });
};
