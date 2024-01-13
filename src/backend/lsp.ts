import { ipcMain } from 'electron';
import { PublishDiagnosticsNotification } from 'vscode-languageserver-protocol';
import { ProtocolConnection } from 'vscode-languageserver-protocol';

export const bindIpcMain = (jsonRpcConnection: ProtocolConnection) => {
  ipcMain.handle('lsp-send-request', async (event, method: string, params: any) => {
    const res = jsonRpcConnection.sendRequest(method, params);
    return res;
  });
  ipcMain.on('lsp-send-notification', (event, method: string, params: any) => {
    jsonRpcConnection.sendNotification(method, params);
  });
};

export const bindWindow = (jsonRpcConnection: ProtocolConnection, browserWindow: Electron.BrowserWindow) => {
  const handleLspOnNotification = (event: Electron.IpcMainEvent, method: string) => {
    const disposable = jsonRpcConnection.onNotification(method, (params) => {
      browserWindow.webContents.send(`lsp-${method}`, params);
    });

    /**
     * Ensure that the listeners only exist with the window
     */
    browserWindow.on('close', () => {
      disposable.dispose();
      ipcMain.removeListener('lsp-on-notification', handleLspOnNotification);
    });
  };
  ipcMain.on('lsp-on-notification', handleLspOnNotification);

  jsonRpcConnection.onNotification(PublishDiagnosticsNotification.type, (params) => {
    browserWindow.webContents.send(
      `lsp-${PublishDiagnosticsNotification.method}`,
      params
    );
  });
};
