import log from '../log';
import cp from 'child_process';
import EventEmitter from 'node:events';

export const emitter = new EventEmitter();

export enum DependencyName {
  OmniSharp = 'OmniSharp',
  SteamCMD = 'SteamCMD',
};

export enum EventKind {
  InstallError = 'InstallError',
  InstallProgress = 'InstallProgress',
};

export interface IDependency {
  app: null | Electron.App;
  readableName: string;
  getInstallPath: () => string;
  install: () => Promise<void>;
  isInstalled: () => Promise<boolean>;
};

export interface IRunnableDependency<StartReturn> extends IDependency {
  instance: null | cp.ChildProcess;
  getStartFilename: () => string;
  start: () => StartReturn;
  isRunning: () => boolean;
}

type ProgressData = {
  percentage: number;
};

export type DependencyEvent = {
  name: DependencyName;
  kind: EventKind;
  msg: string;
  data?: ProgressData;
};

export const logProcess = (instance: cp.ChildProcess) => {
  if (instance !== null) {
    instance.stdout.on('data', (data) => {
      log.info(`stdout: ${data}`);
    });

    instance.stderr.on('data', (data) => {
      log.info(`stderr: ${data}`);
    });

    instance.on('error', (error) => {
      log.info(error.message);
    });

    instance.on('exit', (code, signal) => {
      if (code !== 0) {
        log.error(`Child process exited with code ${code} and signal ${signal}`);
      } else {
        log.info('Child process exited successfully');
      }
    });

    instance.on('close', (code) => {
      log.info(`child process exited with code ${code}`);
      instance = null;
    });
  }
};

