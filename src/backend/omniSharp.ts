import fsx from 'fs-extra';
import * as path from './path';
import { join } from 'node:path';
import { pathToFileURL } from 'url';
import * as cp from 'child_process';
import * as rpc from 'vscode-jsonrpc/node';
import {
  InitializeParams,
  InitializeRequest,
  ClientCapabilities,
  DidOpenTextDocumentNotification,
} from 'vscode-languageserver-protocol';

type OmniSharpInstance = null | cp.ChildProcess;

const getOmniSharpOptions = (projectPath: string): string[] => {
  return [
    '-lsp', // start OmniSharp in language-server mode
    //'-z', // use zero-based indexes - unsure if this is needed
    '-s', // specify the root OmniSharp project directory. should include a dotnet project file
    projectPath
  ];
};

const bind = (instance: OmniSharpInstance) => {
  if (instance !== null) {
    instance.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    instance.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    instance.on('error', (error) => {
      console.error(error.message);
    });

    instance.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`Child process exited with code ${code} and signal ${signal}`);
      } else {
        console.log('Child process exited successfully');
      }
    });

    instance.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      omniSharp = null;
    });
  }
};

let omniSharp: OmniSharpInstance = null;

export const isRunning = () => {
  return omniSharp !== null;
};

export const start = (app: Electron.App) => {
  if (!isRunning()) {
    omniSharp = cp.spawn(
      './OmniSharp',
      getOmniSharpOptions(path.csharpProjectDir(app)),
      {
        cwd: path.omniSharpDir(app),
        env: {
          ...process.env,
          DOTNET_ROOT: '/usr/local/share/dotnet'
        }
      }
    );

    bind(omniSharp);

    const connection = rpc.createMessageConnection(
      new rpc.StreamMessageReader(omniSharp.stdout),
      new rpc.StreamMessageWriter(omniSharp.stdin)
    );

    connection.listen();

    const capabilities: ClientCapabilities = {
      textDocument: {
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

    const csprojPath = join(path.csharpProjectDir(app), 'project.csproj');
    connection.sendRequest(InitializeRequest.type, initializeParams)
      .then((result) => {
        console.info(result.capabilities);
      });

    return connection;
  }
};
