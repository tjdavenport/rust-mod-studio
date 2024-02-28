import { ipcMain } from 'electron';
import { ProtocolConnection } from 'vscode-languageserver-protocol';
import { PublishDiagnosticsNotification } from 'vscode-languageserver-protocol';

export const bindIpcMain = (jsonRpcConnection: ProtocolConnection) => {
  const handleLspSendRequest = async (event: Electron.IpcMainEvent, method: string, params: any) => {
    const res = jsonRpcConnection.sendRequest(method, params);
    return res;
  };
  ipcMain.handle('lsp-send-request', handleLspSendRequest);
  const handleLspSendNotification = (event: Electron.IpcMainEvent, method: string, params: any) => {
    jsonRpcConnection.sendNotification(method, params);
  }
  ipcMain.on('lsp-send-notification', handleLspSendNotification);
  jsonRpcConnection.onClose(() => {
    ipcMain.off('lsp-send-request', handleLspSendRequest);
    ipcMain.off('lsp-send-notification', handleLspSendNotification);
  });
};

export const bindWindow = (jsonRpcConnection: ProtocolConnection, browserWindow: Electron.BrowserWindow) => {
  const handleLspOnNotification = (event: Electron.IpcMainEvent, method: string) => {
    const disposable = jsonRpcConnection.onNotification(method, (params) => {
      browserWindow.webContents.send(`lsp-${method}`, params);
    });

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
