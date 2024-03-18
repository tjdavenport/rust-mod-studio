import { ipcRenderer, contextBridge } from 'electron';
import { MenuItemId, MenuClickParams, ProcessStatusEvent, ProcessStatus, DependencyName } from '../../shared';

export interface SystemApi {
  getPlatform: () => Promise<string>;
  copyToClipboard: (text: string) => Promise<void>;
}

export interface MainDepsApi {
  getOxideTags: () => Promise<{ latestAsset: string; artifact: string }>;
  updateOxide: () => Promise<boolean>;
  updateRustDedicated: () => Promise<boolean>;
  startRustDedicated: () => Promise<boolean>;
  stopRustDedicated: () => Promise<boolean>;
  getProcessStatus: (name: DependencyName) => Promise<ProcessStatus>;
  onRustDedicatedStdout: (callback: (outStr: string) => void) => () => void;
  onProcessStatus: (callback: (event: ProcessStatusEvent) => void) => () => void;
}

export interface LspApi {
  sendRequest: <R>(method: string, params: any) => Promise<R>;
  sendNotification: (method: string, params: any) => void;
  onNotification: <R>(method: string, callback: (params: R) => void) => void;
}

export interface FsApi {
  readCsharpProjectDir: () => Promise<string[]>;
  getCsharpProjectDirURI: () => Promise<string>;
  readTextByURI: (uri: string) => Promise<string>;
  writeTextByURI: (uri: string, contents: string) => Promise<void>;
  removeFileByURI: (uri: string) => Promise<void>;
}

export interface AppMenuApi {
  onClick: (id: MenuItemId, callback: (params: MenuClickParams) => void) => () => void;
}

const system: SystemApi = {
  getPlatform: () => {
    return ipcRenderer.invoke('system-get-platform');
  },
  copyToClipboard: (text: string) => {
    return ipcRenderer.invoke('copy-to-clipboard', text);
  },
};

const deps: MainDepsApi = {
  getOxideTags: () => {
    return ipcRenderer.invoke('dependency-get-oxide-tags');
  },
  updateOxide: () => {
    return ipcRenderer.invoke('dependency-update-oxide');
  },
  updateRustDedicated: () => {
    return ipcRenderer.invoke('dependency-update-rust-dedicated');
  },
  startRustDedicated: () => {
    return ipcRenderer.invoke('dependency-start-rust-dedicated');
  },
  stopRustDedicated: () => {
    return ipcRenderer.invoke('dependency-stop-rust-dedicated');
  },
  getProcessStatus: (name: DependencyName) => {
    return ipcRenderer.invoke('dependency-get-status', name);
  },
  onRustDedicatedStdout: (callback) => {
    const handleRustDedicatedStdout = (event: Electron.IpcRendererEvent, outStr: string) => {
      callback(outStr);
    };
    ipcRenderer.on('rust-dedicated-stdout', handleRustDedicatedStdout);

    return () => ipcRenderer.off('rust-dedicated-stdout', handleRustDedicatedStdout);
  },
  onProcessStatus: (callback) => {
    const handleProcessStatus = (event: Electron.IpcRendererEvent, forwardedEvent: ProcessStatusEvent) => {
      callback(forwardedEvent);
    };
    ipcRenderer.on('dependency-process-status', handleProcessStatus);

    return () => ipcRenderer.off('dependency-process-status', handleProcessStatus);
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
    return ipcRenderer.invoke('fs-write-text-by-uri', uri, contents);
  },
  removeFileByURI: (uri: string) => {
    return ipcRenderer.invoke('fs-remove-file-by-uri', uri);
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