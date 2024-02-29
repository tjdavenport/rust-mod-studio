import log from './backend/log';
import * as fs from './backend/fs';
import * as lsp from './backend/lsp';
import * as deps from './backend/dependencies';
import { applicationMenu } from './backend/menu';
import * as omniSharp from './backend/dependencies/omniSharp';
import { ProtocolConnection } from 'vscode-languageserver-protocol';
import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';

app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-rasterization')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('--no-sandbox')
app.disableHardwareAcceleration();

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let jsonRpcConnection: ProtocolConnection | null = null;

const createMainWindow = (connection: ProtocolConnection) => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();
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
  setupWindow.webContents.openDevTools();
  deps.bindWindow(setupWindow);

  return setupWindow;
};

Menu.setApplicationMenu(applicationMenu);
app.whenReady().then(() => {
  deps.bindIpcMain(app);
  fs.bindIpcMain(app);

  deps.depsInstalled(app)
    .then((installed) => {
      if (installed) {
        jsonRpcConnection = omniSharp.start(app);
        lsp.bindIpcMain(jsonRpcConnection);
        createMainWindow(jsonRpcConnection);
      } else {
        const setupWindow = createSetupWindow();
        ipcMain.once('setup-complete', () => {
          jsonRpcConnection = omniSharp.start(app);
          lsp.bindIpcMain(jsonRpcConnection);
          setupWindow.close();
          createMainWindow(jsonRpcConnection);
        });
      }
    }).catch((error) => {
      log.error(error);
    });

  ipcMain.on('open-browser-url', (event, url) => {
    shell.openExternal(url);
  });

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
