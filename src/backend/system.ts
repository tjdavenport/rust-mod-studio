import { ipcMain, shell } from 'electron';

export const bindIpcMain = () => {
  ipcMain.handle('system-get-platform', () => {
    return process.platform;
  });
  ipcMain.on('open-browser-url', (event, url) => {
    shell.openExternal(url);
  });
};
