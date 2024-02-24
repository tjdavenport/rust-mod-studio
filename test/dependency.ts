import fsx from 'fs-extra';
import test from 'node:test';
import { App } from 'electron';
import { join } from 'node:path';
import assert from 'node:assert';
import log, { cycleTestLogs } from '../src/backend/log';
import * as steamCMD from '../src/backend/dependencies/steamCMD';
import * as omniSharp from '../src/backend/dependencies/omniSharp';
import * as rustDedicated from '../src/backend/dependencies/rustDedicated';
import { DependencyEvent, emitter } from '../src/backend/dependencies/dependency';

const mockedAppPath = join(__dirname, 'tmp', 'installed');
const mockApp = {
  getPath: (pathKind: string): string => {
    return mockedAppPath;
  },
} as App;

test('dependencies', async (root) => {
  root.before(async () => {
    await fsx.emptyDir(mockedAppPath);
    await cycleTestLogs();
  });

  await test('installing OmniSharp', async () => {
    assert(!await omniSharp.isInstalled(mockApp));

    const capturedEvents: string[] = [];

    emitter.on('progress', (event: DependencyEvent) => {
      capturedEvents.push(event.msg);
    });

    await omniSharp.install(mockApp);
    assert(await omniSharp.isInstalled(mockApp));
    assert(capturedEvents.includes(omniSharp.MSG_DOWNLOADING));
    assert(capturedEvents.includes(omniSharp.MSG_EXTRACTING));
  });

  await test('installing SteamCMD and RustDedicated', async () => {
    assert(!await steamCMD.isInstalled(mockApp));

    const capturedEvents: string[] = [];

    emitter.on('progress', (event: DependencyEvent) => {
      capturedEvents.push(event.msg);
    });

    await steamCMD.install(mockApp);
    assert(await steamCMD.isInstalled(mockApp));
    assert(capturedEvents.includes(steamCMD.MSG_DOWNLOADING));
    assert(capturedEvents.includes(steamCMD.MSG_EXTRACTING));

    assert(!await rustDedicated.isInstalled(mockApp));
    await rustDedicated.install(mockApp);
  });
});

