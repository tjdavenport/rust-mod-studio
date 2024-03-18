import { ipcMain, shell, clipboard } from 'electron';

export const bindIpcMain = () => {
  ipcMain.handle('system-get-platform', () => {
    return process.platform;
  });
  ipcMain.on('open-browser-url', (event, url) => {
    shell.openExternal(url);
  });
  ipcMain.handle('copy-to-clipboard', (event, text: string) => {
    clipboard.writeText(text);
    return true;
  });
};
