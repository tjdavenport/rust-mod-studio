
import fsx from 'fs-extra';
import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import * as steamCMD from './steamCMD';
import log, { logProcess } from '../log';
import { DependencyInstallError } from '../error';
import { DependencyName, ProcessStatus, isStartedLogMessage } from '../../shared';
import { emitInstallError, emitInstallProgress, emitStatusChange } from './events';

export const MSG_INSTALLING = 'Installing RustDedicated';
export const MSG_STEAM_CMD_REQUIRED = 'SteamCMD is required to install RustDedicated';
export const MSG_FAILED_INSTALLING = 'Failed to install RustDedicated';

export let instance: null | cp.ChildProcess = null;
export let status: ProcessStatus = ProcessStatus.Stopped;

const changeStatus = (newStatus: ProcessStatus) => {
  status = newStatus;
  emitStatusChange(DependencyName.RustDedicated, newStatus);
};

export const getInstallPath = (app: Electron.App) => {
  // steamCMD seems to install to a lowercase directory regardless
  // of the casing provided
  return join(path.getRootDir(app), 'rustdedicated');
};

export const getStartFilename = () => {
  if (process.platform === 'darwin') {
    return 'RustDedicated';
  } else if (process.platform === 'win32') {
    return 'RustDedicated.exe';
  }
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

export const startArgs = () => {
  return [
    '-batchmode',
    '+server.hostname',
    'Rust Mod Studio Development Server',
    '+server.worldsize',
    '2000'
  ];
};

export const stop = () => {
  return new Promise<void>((resolve, reject) => {
    if (instance === null) {
      return resolve();
    }
    changeStatus(ProcessStatus.Stopping);

    instance.on('close', () => {
      changeStatus(ProcessStatus.Stopped);
      return resolve();
    });

    instance.on('error', (error) => {
      return reject(error);
    });

    instance.kill('SIGINT');
  });
};

export const start = (app: Electron.App) => {
  if (instance !== null) {
    return;
  }
  
  const installPath = getInstallPath(app);
  instance = cp.spawn(
    './' + getStartFilename(),
    startArgs(),
    {
      cwd: installPath,
    }
  );
  instance.on('close', () => {
    instance = null;
  });

  const listenForStarted = (data: Buffer) => {
    if (isStartedLogMessage(data.toString())) {
      changeStatus(ProcessStatus.Running);
      instance.stdout.off('data', listenForStarted);
    }
  };
  instance.stdout.on('data', listenForStarted);

  changeStatus(ProcessStatus.Starting);
  logProcess(instance);
};

/**
 * @TODO - Consider moving event emission into ./index.ts under a wider try/catch
 */
export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!await steamCMD.isInstalled(app)) {
        const error = new DependencyInstallError(MSG_STEAM_CMD_REQUIRED);
        emitInstallError(DependencyName.RustDedicated, error.message);
        return reject(error);
      }
      emitInstallProgress(DependencyName.RustDedicated, MSG_INSTALLING);
      steamCMD.start(app, installArgs(app));
      steamCMD.instance.on('error', (error) => {
        emitInstallError(DependencyName.RustDedicated, MSG_FAILED_INSTALLING);
        return reject(error);
      });
      steamCMD.instance.on('exit', (code: number) => {
        if (code !== 0) {
          const error = new DependencyInstallError(MSG_FAILED_INSTALLING);
          emitInstallError(DependencyName.RustDedicated, error.message);
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