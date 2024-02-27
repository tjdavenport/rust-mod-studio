import * as fs from './backend/fs';
import * as lsp from './backend/lsp';
import { applicationMenu } from './backend/menu';
import * as deps from './backend/dependencies';
import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_WEBPACK_ENTRY: string;
declare const SETUP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  mainWindow.webContents.openDevTools();

  return mainWindow;
};

const createSetupWindow = () => {
  const setupWindow = new BrowserWindow({
    height: 600,
    width: 800,
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

  deps.depsInstalled(app)
    .then((installed) => {
      if (installed) {
      } else {
        createSetupWindow();
      }
    }).catch((error) => {

    });

  /*const jsonRpcConnection = omniSharp.start();
  const initialWindow = createMainWindow();

  lsp.bindIpcMain(jsonRpcConnection);
  lsp.bindWindow(jsonRpcConnection, initialWindow);
  fs.bindIpcMain(app);

  ipcMain.on('open-browser-url', (event, url) => {
    shell.openExternal(url);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });*/
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
