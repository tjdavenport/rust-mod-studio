import fsx from 'fs-extra';
import test from 'node:test';
import { App } from 'electron';
import { join } from 'node:path';
import assert from 'node:assert';
import log, { cycleTestLogs } from '../src/backend/log';
import { DependencyEvent, emitter } from '../src/backend/dependencies/dependency';
import omniSharp, {
  MSG_DOWNLOADING as OMNI_SHARP_MSG_DOWNLOADING, MSG_EXTRACTING as OMNI_SHARP_MSG_EXTRACTING
} from '../src/backend/dependencies/omniSharp';
import steamCMD, {
  MSG_DOWNLOADING as STEAM_CMD_MSG_DOWNLOADING, MSG_EXTRACTING as STEAM_CMD_MSG_EXTRACTING
} from '../src/backend/dependencies/steamCMD';

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
    omniSharp.app = mockApp;
    assert(!await omniSharp.isInstalled());

    const capturedEvents: string[] = [];

    emitter.on('progress', (event: DependencyEvent) => {
      capturedEvents.push(event.msg);
    });

    await omniSharp.install();
    assert(await omniSharp.isInstalled());
    assert(capturedEvents.includes(OMNI_SHARP_MSG_DOWNLOADING));
    assert(capturedEvents.includes(OMNI_SHARP_MSG_EXTRACTING));
  });

  await test('installing SteamCMD', async () => {
    steamCMD.app = mockApp;
    assert(!await steamCMD.isInstalled());

    const capturedEvents: string[] = [];

    emitter.on('progress', (event: DependencyEvent) => {
      capturedEvents.push(event.msg);
    });

    await steamCMD.install();
    assert(await steamCMD.isInstalled());
    assert(capturedEvents.includes(STEAM_CMD_MSG_DOWNLOADING));
    assert(capturedEvents.includes(STEAM_CMD_MSG_EXTRACTING));
  });
});

