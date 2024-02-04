import tar from 'tar';
import log from '../log';
import fsx from 'fs-extra';
import fetch from 'node-fetch';
import * as path from '../path';
import { join } from 'node:path';
import * as cp from 'child_process';
import { IRunnableDependency, DependencyEvent, DependencyName, EventKind, emitter, logProcess } from './dependency';

const platformURL = new Map<string, string>();
platformURL.set(
  'darwin',
  'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_osx.tar.gz'
);

export const MSG_DOWNLOADING = 'Downloading SteamCMD';
export const MSG_EXTRACTING = 'Extracting SteamCMD';
export const MSG_FAILED_DOWNLOADING = 'Failed to download SteamCMD';
export const MSG_FAILED_EXTRACTING = 'Failed to extract SteamCMD';

const emitInstallError = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.SteamCMD,
    kind: EventKind.InstallError,
    msg
  };
  emitter.emit('error', event);
};
const emitInstallProgress = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.SteamCMD,
    kind: EventKind.InstallProgress,
    msg,
  };
  emitter.emit('progress', event);
};

const steamCMD: IRunnableDependency<void> = {
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
    if (!this.isRunning()) {
      log.info(this.getInstallPath());
      this.instance = cp.spawn(
        './' + this.getStartFilename(),
        ['+quit'],
        {
          cwd: this.getInstallPath(),
        }
      );

      logProcess(this.instance);

      this.instance.on('exit', () => {
        this.instance = null;
      });
    }
  },
  install() {
    return new Promise(async (resolve, reject) => {
      try {
        const downloadURL = platformURL.get(process.platform);
        const response = await fetch(downloadURL);
        emitInstallProgress(MSG_DOWNLOADING);
        const emitResponseError = () => emitInstallError(MSG_FAILED_DOWNLOADING);

        if (response.ok) {
          await fsx.ensureDir(this.getInstallPath());
          const extractStream = tar.x({ cwd: this.getInstallPath() });

          response.body.pipe(extractStream);
          emitInstallProgress(MSG_EXTRACTING);
          response.body.on('error', (error) => {
            emitResponseError();
            return reject(error);
          });

          extractStream.on('error', (error) => {
            emitInstallError(MSG_FAILED_EXTRACTING);
            return reject(error);
          });
          extractStream.on('close', () => {
            // SteamCMD will update itself on the first start
            this.start();
            this.instance.on('exit', (code: number) => {
              if (code !== 0) {
                return reject(code);
              } else {
                return resolve();
              }
            });
          });
        } else {
          emitResponseError();
          return reject(new Error('download response not ok'));
        }

      } catch (error) {
        return reject(error);
      }
    });
  },
  async isInstalled() {
    try {
      return await fsx.pathExists(join(this.getInstallPath(), this.getStartFilename()));
    } catch (error) {
      log.error(error);
      return false;
    }
  },
  isRunning() {
    return this.instance !== null;
  },
};

export default steamCMD;
