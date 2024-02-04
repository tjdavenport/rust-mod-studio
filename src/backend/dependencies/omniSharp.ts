import log from '../log';
import fsx from 'fs-extra';
import fetch from 'node-fetch';
import * as path from '../path';
// may be possible to rely on tar module,
// @TODO consider & investigate removing unzipper
import unzipper from 'unzipper';
import { join } from 'node:path';
import { pathToFileURL } from 'url';
import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc/node';
import { IRunnableDependency, DependencyEvent, DependencyName, EventKind, emitter, logProcess } from './dependency';
import {
  InitializeParams,
  InitializeRequest,
  ClientCapabilities,
  MessageConnection,
} from 'vscode-languageserver-protocol';

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

const omniSharp: IRunnableDependency<MessageConnection | void> = {
  app: null,
  instance: null,
  readableName: 'OmniSharp',
  getInstallPath() {
    return join(path.getRootDir(this.app), 'omnisharp');
  },
  getStartFilename() {
    return './OmniSharp';
  },
  start() {
    if (!this.isRunning()) {
      this.instance = cp.spawn(
        this.getStartFilename(),
        getOmniSharpOptions(path.csharpProjectDir(this.app)),
        {
          cwd: this.getInstallPath(),
          env: {
            ...process.env,
            DOTNET_ROOT: '/usr/local/share/dotnet'
          }
        }
      );

      logProcess(this.instance);

      this.instance.on('exit', () => {
        this.instance = null;
      });

      const connection = rpc.createMessageConnection(
        new rpc.StreamMessageReader(this.instance.stdout),
        new rpc.StreamMessageWriter(this.instance.stdin)
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
            uri: pathToFileURL(path.csharpProjectDir(this.app)).href,
            name: 'rust-mod-studio'
          }
        ]
      };

      connection.sendRequest(InitializeRequest.type, initializeParams)
        .then((result) => {
          console.info(result.capabilities);
        });

      return connection;
    }
  },
  install() {
    return new Promise(async (resolve, reject) => {
      try {
        const downloadURL = platformArchURL.get(`${process.platform}-${process.arch}`);
        const response = await fetch(downloadURL);
        emitInstallProgress(MSG_DOWNLOADING);
        const emitResponseError = () => emitInstallError(MSG_FAILED_DOWNLOADING);

        if (response.ok) {
          await fsx.ensureDir(this.getInstallPath());
          const extractStream = unzipper.Extract({ path: this.getInstallPath() });

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

export default omniSharp;
