import log from './backend/log';
import * as fs from './backend/fs';
import * as lsp from './backend/lsp';
import * as system from './backend/system';
import * as deps from './backend/dependencies';
import { applicationMenu, emptyMenu } from './backend/menu';
import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as omniSharp from './backend/dependencies/omniSharp';
import { ProtocolConnection } from 'vscode-languageserver-protocol';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let jsonRpcConnection: ProtocolConnection | null = null;

const createMainWindow = (connection: ProtocolConnection) => {
  Menu.setApplicationMenu(applicationMenu);
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 1150,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  deps.bindWindow(mainWindow);
  lsp.bindWindow(connection, mainWindow);

  return mainWindow;
};

const createSetupWindow = () => {
  const setupWindow = new BrowserWindow({
    height: 341,
    width: 341,
    webPreferences: {
      preload: SETUP_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  setupWindow.loadURL(SETUP_WINDOW_WEBPACK_ENTRY);
  deps.bindWindow(setupWindow);

  return new Promise<Electron.BrowserWindow>((resolve) => {
    ipcMain.once('setup-complete', () => {
      return resolve(setupWindow);
    });
  });
};

Menu.setApplicationMenu(emptyMenu);
app.whenReady().then(async () => {
  deps.bindIpcMain(app);
  system.bindIpcMain();
  fs.bindIpcMain(app);

  try {
    const installed = await deps.depsInstalled(app);

    if (installed) {
      jsonRpcConnection = await omniSharp.start(app);
      lsp.bindIpcMain(jsonRpcConnection);
      createMainWindow(jsonRpcConnection);
    } else {
      const setupWindow = await createSetupWindow();
      jsonRpcConnection = await omniSharp.start(app);
      lsp.bindIpcMain(jsonRpcConnection);
      setupWindow.close();
      createMainWindow(jsonRpcConnection);
    }
  } catch (error) {
    log.error(error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && jsonRpcConnection) {
      createMainWindow(jsonRpcConnection);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
