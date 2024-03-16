export enum MenuItemId {
  Save = '1'
};

export type MenuClickParams = {
  pathname?: string;
};

export type OxideTags = {
  latestAsset: string;
  artifact: string;
};

export enum DependencyName {
  OmniSharp = 'OmniSharp',
  SteamCMD = 'SteamCMD',
  OxideRust = 'Oxide',
  RustDedicated = 'RustDedicated',
};

export enum EventKind {
  InstallError = 'InstallError',
  InstallProgress = 'InstallProgress',
  StatusChange = 'StatusChange',
};

export type DependencyEvent = {
  name: DependencyName;
  kind: EventKind;
  msg?: string;
};

export type ProcessStatusEvent = DependencyEvent & {
  status: ProcessStatus
};

export enum ProcessStatus {
  Starting = 'starting',
  Stopping = 'stopping',
  Running = 'running',
  Stopped = 'stopped'
};

export const isStartedLogMessage = (message: string) => {
  return message.includes('Server startup complete');
};