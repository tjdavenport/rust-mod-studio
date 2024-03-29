import fsx from 'fs-extra';
import fetch from 'node-fetch';
import * as path from '../path';
import { promisify } from 'util';
import { join } from 'node:path';
import decompress from 'decompress';
import { pathToFileURL } from 'url';
import * as cp from 'child_process';
import log, { logProcess } from '../log';
import { finished } from 'stream/promises';
import * as rpc from 'vscode-jsonrpc/node';
import {
  InitializeParams,
  InitializeRequest,
  ClientCapabilities,
} from 'vscode-languageserver-protocol';
import { DependencyName } from '../../shared';
import { emitInstallProgress } from './events';
import { shellEnv as getShellEnv } from 'shell-env';

const platformArchURL = new Map<string, string>();
platformArchURL.set(
  'darwin-arm64',
  'https://github.com/OmniSharp/omnisharp-roslyn/releases/download/v1.39.9/omnisharp-osx-arm64-net6.0.zip'
);
platformArchURL.set(
  'win32-x64',
  'https://github.com/OmniSharp/omnisharp-roslyn/releases/download/v1.39.10/omnisharp-win-x64-net6.0.zip'
);
platformArchURL.set(
  'linux-x64',
  'https://github.com/OmniSharp/omnisharp-roslyn/releases/download/v1.39.11/omnisharp-linux-x64-net6.0.zip'
);

const getOmniSharpOptions = (projectPath: string): string[] => {
  return [
    '-lsp', // start OmniSharp in language-server mode
    //'-z', // use zero-based indexes - unsure if this is needed
    '-s', // specify the root OmniSharp project directory. should include a dotnet project file
    projectPath
  ];
};

export const MSG_DOWNLOADING = 'Downloading OmniSharp';
export const MSG_EXTRACTING = 'Extracting OmniSharp';
export const MSG_FAILED_DOWNLOADING = 'Failed to download OmniSharp';

let instance: null | cp.ChildProcess = null;

export const getInstallPath = (app: Electron.App) => {
  return join(path.getRootDir(app), 'omnisharp');
};

export const name = DependencyName.OmniSharp;

const exec = promisify(cp.exec);
export const hasDotnet6 = async () => {
  /**
   * exec() will throw if the command does not exist
   */
  try {
    const env = await getShellEnv();
    const { stdout } = await exec('dotnet --version', {
      env
    });
    const [ major ] = stdout.split('.');

    if (isNaN(+major)) {
      return false;
    }

    if (Number(major) >= 6) {
      return true;
    }
  } catch (error) {
    log.error(error);
    return false;
  }
};

export const getStartFilename = () => {
  if (process.platform === 'win32') {
    return './OmniSharp.exe'
  }
  return './OmniSharp';
};

/**
 * @TODO - there should be some user feedback when
 * OmniSharp fails to start.
 */
export const start = async (app: Electron.App) => {
  if (instance !== null) {
    return;
  }

  const shellEnv = await getShellEnv();
  const env = { ...shellEnv };

  if (process.platform === 'darwin') {
    env.DOTNET_ROOT = '/usr/local/share/dotnet';
  }

  instance = cp.spawn(
    getStartFilename(),
    getOmniSharpOptions(path.csharpProjectDir(app)),
    {
      cwd: getInstallPath(app),
      env
    }
  );

  logProcess(instance);

  instance.on('exit', () => {
    instance = null;
  });

  const connection = rpc.createMessageConnection(
    new rpc.StreamMessageReader(instance.stdout),
    new rpc.StreamMessageWriter(instance.stdin)
  );

  connection.listen();

  const capabilities: ClientCapabilities = {
    textDocument: {
      codeAction: {
        dataSupport: true,
        resolveSupport: {
          properties: []
        },
      },
      publishDiagnostics: {
        relatedInformation: true,
        codeDescriptionSupport: true,
      },
      completion: {
        dynamicRegistration: false,
        contextSupport: true,
        completionItem: {
          commitCharactersSupport: true,
        }
      },
      synchronization: {
        didSave: true,
        dynamicRegistration: true
      },
    },
  };
  const initializeParams: InitializeParams = {
    processId: process.pid,
    capabilities,
    rootUri: null,
    workspaceFolders: [
      {
        uri: pathToFileURL(path.csharpProjectDir(app)).href,
        name: 'rust-mod-studio'
      }
    ]
  };

  connection.sendRequest(InitializeRequest.type, initializeParams)
    .then((result) => {
      console.info(result.capabilities);
    });

  return connection;
};

export const install = async (app: Electron.App) => {
  const downloadURL = platformArchURL.get(`${process.platform}-${process.arch}`);
  const response = await fetch(downloadURL);
  emitInstallProgress(DependencyName.OmniSharp, MSG_DOWNLOADING);

  if (response.ok) {
    await fsx.ensureDir(getInstallPath(app));
    await fsx.ensureDir(path.artifactDir(app));

    const zipPath = join(path.artifactDir(app), 'omnisharp.zip');
    const writeZip = fsx.createWriteStream(zipPath, {
      flags: 'wx'
    });

    await finished(response.body.pipe(writeZip));
    emitInstallProgress(DependencyName.OmniSharp, MSG_EXTRACTING);
    await decompress(zipPath, getInstallPath(app), {
      map: (file) => {
        if (file.type === 'file' && file.path.endsWith('/')) {
          file.type = 'directory'
        }
        return file
      },
    });
    await fsx.chmod(join(getInstallPath(app), getStartFilename()), '777');
    return;
  } else {
    throw new Error(MSG_FAILED_DOWNLOADING);
  }
};

export const isInstalled = async (app: Electron.App) => {
  try {
    return await fsx.pathExists(join(getInstallPath(app), getStartFilename()));
  } catch (error) {
    log.error(error);
    return false;
  }
};
