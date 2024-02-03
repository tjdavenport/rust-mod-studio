import fsx from 'fs-extra';
import test from 'node:test';
import { App } from 'electron';
import { join } from 'node:path';
import assert from 'node:assert';
import log, { cycleTestLogs } from '../src/backend/log';
import dependencyEvents from '../src/backend/dependencies/emitter';
import { DependencyEvent } from '../src/backend/dependencies/IDependency';
import omniSharp, { MSG_DOWNLOADING, MSG_EXTRACTING } from '../src/backend/dependencies/omniSharp';

const mockedAppPath = join(__dirname, 'tmp', 'installed');
const mockApp = {
  getPath: (pathKind: string): string => {
    return mockedAppPath;
  },
} as App;

test('installing OmniSharp', async (t) => {
  omniSharp.app = mockApp;
  await fsx.emptyDir(mockedAppPath);
  await cycleTestLogs();
  assert(!await omniSharp.isInstalled());

  const capturedEvents: string[] = [];

  dependencyEvents.on('progress', (event: DependencyEvent) => {
    capturedEvents.push(event.msg);
  });

  await omniSharp.install();
  assert(await omniSharp.isInstalled());
  assert(capturedEvents.includes(MSG_DOWNLOADING));
  assert(capturedEvents.includes(MSG_EXTRACTING));
});
