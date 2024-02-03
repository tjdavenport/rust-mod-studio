import cp from 'child_process';
import EventEmitter from 'node:events';

export const emitter = new EventEmitter();

export enum DependencyName {
  OmniSharp = 'OmniSharp',
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

export interface IRunnableDependency extends IDependency {
  instance: null | cp.ChildProcess;
  getStartFilename: () => string;
  start: () => any;
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
