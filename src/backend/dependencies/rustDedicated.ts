import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import { IRunnableDependency, DependencyEvent, DependencyName, EventKind, emitter } from './dependency';

const rustDedicated: IRunnableDependency = {
  app: null,
  instance: null,
  readableName: 'RustDedicated',
  getInstallPath() {
    return 'foobar'
  },
  getStartFilename() {
    return 'RustDedicated';
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

export default rustDedicated;
