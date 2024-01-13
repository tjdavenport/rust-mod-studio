import path from 'node:path';

const rootDirName = 'rust-mod-studio';
const platform = process.platform;
const isWindows = platform === 'win32';
const isOSX = platform === 'darwin';

const getRootDir = (app: Electron.App) => {
  if (isWindows) {
    return path.join(app.getPath('appData'), 'rust-mod-studio');
  }
  if (isOSX) {
    return path.join(app.getPath('home'), 'Library', 'rust-mod-studio');
  }

  /**
   * @TODO - handle unsupported platforms gracefully
   */
  return path.join('/');
};

export const csharpProjectDir = (app: Electron.App) => {
  return path.join(getRootDir(app), 'project');
};

export const csharpProjectFile = (app: Electron.App, filename: string) => {
  return path.join(csharpProjectDir(app), filename);
};

export const omniSharp = (app: Electron.App) => {
  if (isWindows) {
    return path.join(getRootDir(app), 'omnisharp', 'OmniSharp');
  }
  if (isOSX) {
    return path.join(getRootDir(app), 'omnisharp', 'OmniSharp');
  }

  /**
   * @TODO - handle unsupported platforms gracefully
   */
  return path.join('/');
};

export const omniSharpDir = (app: Electron.App) => {
  if (isWindows) {
    return path.join(getRootDir(app), 'omnisharp');
  }
  if (isOSX) {
    return path.join(getRootDir(app), 'omnisharp');
  }

  /**
   * @TODO - handle unsupported platforms gracefully
   */
  return path.join('/');
};

export const steamCmd = (app: Electron.App) => {
  if (isWindows) {
    return path.join(getRootDir(app), 'SteamCMD', 'steamcmd.exe');
  }
  if (isOSX) {
    return path.join(getRootDir(app), 'Steam', 'steamcmd.sh');
  }

  /**
   * @TODO - handle unsupported platforms gracefully
   */
  return path.join('/');
};
