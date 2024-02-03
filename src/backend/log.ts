import fsx from 'fs-extra';
import { join } from 'node:path';

const testTmpDir = join(__dirname, '../../test/tmp');
const testLogFile = join(testTmpDir, 'logs.txt');

export const cycleTestLogs = async () => {
  await fsx.ensureFile(testLogFile);
  await fsx.truncate(testLogFile);
};

export default {
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
