import * as path from '../path';
import { join } from 'node:path';
import { IDependency, DependencyEvent, DependencyName, EventKind, emitter } from './dependency';

const oxideRust: IDependency = {
  app: null,
  readableName: 'foobar',
  getInstallPath() {
    return 'foobar';
  },
  install() {
    return new Promise((resolve, reject) => {
      resolve();
    });
  },
  async isInstalled() {
    return false;
  },
};

export default oxideRust;
