import cp from 'child_process';
import EventEmitter from 'node:events';

export enum DependencyName {
  OmniSharp = 'OmniSharp',
};

export enum EventKind {
  InstallError = 'InstallError',
  InstallProgress = 'InstallProgress',
};

export default interface IDependency {
  app: null | Electron.App;
  instance: null | cp.ChildProcess;
  readableName: string;
  getInstallPath: () => string;
  getStartFilename: () => string;
  start: () => any;
  install: () => Promise<void>;
  isInstalled: () => Promise<boolean>;
  isRunning: () => boolean;
};

type ProgressData = {
  percentage: number;
};

export type DependencyEvent = {
  name: DependencyName;
  kind: EventKind;
  msg: string;
  data?: ProgressData;
};
