export enum MenuItemId {
  Save = '1'
};

export type MenuClickParams = {
  pathname?: string;
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
