import log from '../log';
import fsx from 'fs-extra';
import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import * as steamCMD from './steamCMD';
import { DependencyInstallError } from '../error';
import { DependencyEvent, DependencyName, EventKind, emitter } from './dependency';

export const MSG_DOWNLOADING = 'Installing RustDedicated';
export const MSG_STEAM_CMD_REQUIRED = 'SteamCMD is required to install RustDedicated';
export const MSG_FAILED_INSTALLING = 'Failed to install RustDedicated';

const emitInstallError = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.RustDedicated,
    kind: EventKind.InstallError,
    msg
  };
  emitter.emit('error', event);
};
const emitInstallProgress = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.RustDedicated,
    kind: EventKind.InstallProgress,
    msg,
  };
  emitter.emit('progress', event);
};

export const getInstallPath = (app: Electron.App) => {
  // steamCMD seems to install to a lowercase directory regardless
  // of the casing provided
  return join(path.getRootDir(app), 'rustdedicated');
};

export const getStartFilename = () => {
  return 'RustDedicated';
};

const installArgs = (app: Electron.App) => {
  const installPath = getInstallPath(app);
  const args = [
    '+force_install_dir',
    installPath,
    '+login',
    'anonymous',
    '+app_update',
    '258550',
    'validate',
    '+quit',
  ];

  // Valve does not maintain an OSX version of
  // RustDedicated, so install the linux version when
  // platform is darwin
  if (process.platform === 'darwin') {
    args.unshift('+@sSteamCmdForcePlatformType linux');
  }

  return args;
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
    try {
      if (!await steamCMD.isInstalled(app)) {
        const error = new DependencyInstallError(MSG_STEAM_CMD_REQUIRED);
        emitInstallError(error.message);
        return reject(error);
      }
      steamCMD.start(app, installArgs(app));
      steamCMD.instance.on('error', (error) => {
        emitInstallError(MSG_FAILED_INSTALLING);
        return reject(error);
      });
      steamCMD.instance.on('exit', (code: number) => {
        if (code !== 0) {
          const error = new DependencyInstallError(MSG_FAILED_INSTALLING);
          emitInstallError(error.message);
          return reject(error);
        } else {
          return resolve();
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};
