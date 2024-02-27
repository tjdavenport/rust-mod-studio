import fsx from 'fs-extra';
import fetch from 'node-fetch';
import * as path from '../path';
// may be possible to rely on tar module,
// @TODO consider & investigate removing unzipper
import unzipper from 'unzipper';
import { join } from 'node:path';
import { emitter } from './events';
import { pathToFileURL } from 'url';
import * as cp from 'child_process';
import log, { logProcess } from '../log';
import * as rpc from 'vscode-jsonrpc/node';
import {
  InitializeParams,
  InitializeRequest,
  ClientCapabilities,
} from 'vscode-languageserver-protocol';
import { DependencyEvent, DependencyName, EventKind } from '../../shared';

const platformArchURL = new Map<string, string>();
platformArchURL.set(
  'darwin-arm64',
  'https://github.com/OmniSharp/omnisharp-roslyn/releases/download/v1.39.10/omnisharp-osx-arm64-net6.0.zip'
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
export const MSG_FAILED_EXTRACTING = 'Failed to extract OmniSharp';

const emitInstallError = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.OmniSharp,
    kind: EventKind.InstallError,
    msg
  };
  emitter.emit('error', event);
};
const emitInstallProgress = (msg: string) => {
  const event: DependencyEvent = {
    name: DependencyName.OmniSharp,
    kind: EventKind.InstallProgress,
    msg,
  };
  emitter.emit('progress', event);
};

let instance: null | cp.ChildProcess = null;

export const getInstallPath = (app: Electron.App) => {
  return join(path.getRootDir(app), 'omnisharp');
};

export const getStartFilename = () => {
  return './OmniSharp';
};

export const start = (app: Electron.App) => {
  if (instance !== null) {
    return;
  }

  instance = cp.spawn(
    getStartFilename(),
    getOmniSharpOptions(path.csharpProjectDir(app)),
    {
      cwd: getInstallPath(app),
      env: {
        ...process.env,
        DOTNET_ROOT: '/usr/local/share/dotnet'
      }
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

export const install = (app: Electron.App) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const downloadURL = platformArchURL.get(`${process.platform}-${process.arch}`);
      const response = await fetch(downloadURL);
      emitInstallProgress(MSG_DOWNLOADING);
      const emitResponseError = () => emitInstallError(MSG_FAILED_DOWNLOADING);

      if (response.ok) {
        await fsx.ensureDir(getInstallPath(app));
        const extractStream = unzipper.Extract({ path: getInstallPath(app) });

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
          return resolve();
        });
      } else {
        emitResponseError();
        return reject(new Error('download response not ok'));
      }

    } catch (error) {
      return reject(error);
    }
  });
};

export const isInstalled = async (app: Electron.App) => {
  try {
    return await fsx.pathExists(join(getInstallPath(app), getStartFilename()));
  } catch (error) {
    log.error(error);
    return false;
  }
};
