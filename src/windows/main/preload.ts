import { ipcRenderer, contextBridge } from 'electron';
import { MenuItemId, MenuClickParams } from '../../shared';

export interface SystemApi {
  getPlatform: () => Promise<string>;
}

export interface MainDepsApi {
  getOxideTags: () => Promise<{ latestAsset: string; artifact: string }>;
  updateOxide: () => Promise<boolean>;
}

export interface LspApi {
  sendRequest: <R>(method: string, params: any) => Promise<R>;
  sendNotification: (method: string, params: any) => void;
  onNotification: <R>(method: string, callback: (params: R) => void) => void;
}

export interface FsApi {
  readCsharpProjectDir: () => Promise<string[]>;
  getCsharpProjectDirURI: () => Promise<string>;
  readTextByURI: (url: string) => Promise<string>;
  writeTextByURI: (url: string, contents: string) => Promise<void>;
}

export interface AppMenuApi {
  onClick: (id: MenuItemId, callback: (params: MenuClickParams) => void) => () => void;
}

const system: SystemApi = {
  getPlatform: () => {
    return ipcRenderer.invoke('system-get-platform');
  }
};

const deps: MainDepsApi = {
  getOxideTags: () => {
    return ipcRenderer.invoke('dependency-get-oxide-tags');
  },
  updateOxide: () => {
    return ipcRenderer.invoke('dependency-update-oxide');
  },
};

const lsp: LspApi = {
  sendRequest: (method: string, params: any) => {
    return ipcRenderer.invoke('lsp-send-request', method, params);
  },
  sendNotification: (method: string, params: any) => {
    return ipcRenderer.send('lsp-send-notification', method, params);
  },
  onNotification: <R>(method: string, callback: (params: R) => void) => {
    ipcRenderer.on(`lsp-${method}`, (event, params) => {
      callback(params);
    });
  },
};

const fs: FsApi = {
  readCsharpProjectDir: () => {
    return ipcRenderer.invoke('fs-read-csharp-project-dir');
  },
  getCsharpProjectDirURI: () => {
    return ipcRenderer.invoke('fs-get-csharp-project-dir-uri');
  },
  readTextByURI: (uri: string) => {
    return ipcRenderer.invoke('fs-read-text-by-uri', uri);
  },
  writeTextByURI: (uri: string, contents: string) => {
    /**
     * @TODO - consider using invoke so write errors can be handled
     */
    return ipcRenderer.invoke('fs-write-text-by-uri', uri, contents);
  },
};

const appMenu: AppMenuApi = {
  onClick: (id: MenuItemId, callback: (params: MenuClickParams) => void) => {
    const handler = (event: Electron.IpcRendererEvent, params: MenuClickParams) => {
      callback(params);
    };
    ipcRenderer.on(`app-menu-click-${id}`, handler);

    return () => {
      ipcRenderer.off(`app-menu-click-${id}`, handler);
    };
  } 
};

contextBridge.exposeInMainWorld('system', system);
contextBridge.exposeInMainWorld('mainDeps', deps);
contextBridge.exposeInMainWorld('fs', fs);
contextBridge.exposeInMainWorld('lsp', lsp);
contextBridge.exposeInMainWorld('appMenu', appMenu);
