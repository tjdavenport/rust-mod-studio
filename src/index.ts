import * as fs from './backend/fs';
import * as lsp from './backend/lsp';
import * as omniSharp from './backend/omniSharp';
import { applicationMenu } from './backend/menu';
import { app, BrowserWindow, ipcMain, shell, Menu } from 'electron';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
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

Menu.setApplicationMenu(applicationMenu);
app.whenReady().then(() => {
  const jsonRpcConnection = omniSharp.start(app);
  const initialWindow = createWindow();

  lsp.bindIpcMain(jsonRpcConnection);
  lsp.bindWindow(jsonRpcConnection, initialWindow);
  fs.bindIpcMain(app);

  ipcMain.on('open-browser-url', (event, url) => {
    shell.openExternal(url);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
