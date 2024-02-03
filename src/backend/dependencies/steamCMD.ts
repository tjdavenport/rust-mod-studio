import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import { IRunnableDependency, DependencyEvent, DependencyName, EventKind, emitter } from './dependency';

const steamCMD: IRunnableDependency = {
  app: null,
  instance: null,
  readableName: 'SteamCMD',
  getInstallPath() {
    if (process.platform === 'win32') {
      return join(path.getRootDir(this.app), 'SteamCMD');
    }
    return join(path.getRootDir(this.app), 'Steam');
  },
  getStartFilename() {
    return 'steamcmd.sh';
  },
  start() {

  },
  install() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  },
  async isInstalled() {
    return false;
  },
  isRunning() {
    return this.instance !== null;
  },
};

export default steamCMD;
