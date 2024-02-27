import fsx from 'fs-extra';
import cp from 'child_process';
import { join } from 'node:path';

const testTmpDir = join(__dirname, '../../test/tmp');
const testLogFile = join(testTmpDir, 'logs.txt');

export const cycleTestLogs = async () => {
  await fsx.ensureFile(testLogFile);
  await fsx.truncate(testLogFile);
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

const log = {
  info(msg: string) {
    if (process.env.NODE_ENV === 'test') {
      return fsx.appendFile(testLogFile, `INFO: ${msg}\n`);
    }

    console.info(msg);
    return Promise.resolve();
  },
  error(msg: string) {
    if (process.env.NODE_ENV === 'test') {
      return fsx.appendFile(testLogFile, `ERROR: ${msg}\n`);
    }

    console.error(msg);
    return Promise.resolve();
  },
};

export default log;
