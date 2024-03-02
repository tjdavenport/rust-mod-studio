import { ipcMain } from 'electron';

export const bindIpcMain = () => {
  ipcMain.handle('system-get-platform', () => {
    return process.platform;
  });
};
