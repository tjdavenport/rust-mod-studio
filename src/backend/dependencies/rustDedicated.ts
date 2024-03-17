import fsx from 'fs-extra';
import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import * as steamCMD from './steamCMD';
import log, { logProcess } from '../log';
import { emitInstallProgress, emitStatusChange } from './events';
import { DependencyName, ProcessStatus, isStartedLogMessage } from '../../shared';

export const MSG_INSTALLING = 'Installing RustDedicated';
export const MSG_STEAM_CMD_REQUIRED = 'SteamCMD is required to install RustDedicated';
export const MSG_FAILED_INSTALLING = 'Failed to install RustDedicated';

export let instance: null | cp.ChildProcess = null;
export let status: ProcessStatus = ProcessStatus.Stopped;

export const name = DependencyName.RustDedicated;

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

export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      if (!await steamCMD.isInstalled(app)) {
        return reject(new Error(MSG_STEAM_CMD_REQUIRED));
      }
      emitInstallProgress(DependencyName.RustDedicated, MSG_INSTALLING);

      steamCMD.start(app, installArgs(app));
      steamCMD.instance.on('error', (error) => {
        log.error(error.message);
        return reject(new Error(MSG_FAILED_INSTALLING));
      });
      steamCMD.instance.on('exit', (code: number) => {
        if (code !== 0) {
          return reject(new Error(MSG_FAILED_INSTALLING));
        } else {
          return resolve();
        }
      });
    } catch (error) {
      return reject(error);
    }
  });
};
