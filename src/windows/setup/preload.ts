import { DependencyEvent } from '../../shared';
import { ipcRenderer, contextBridge } from 'electron';

export interface SetupDepsApi {
  setupComplete: () => void;
  hasDotnet6: () => Promise<boolean>;
  ensureInstalled: () => Promise<boolean>;
  onProgress: (callback: (event: DependencyEvent) => void) => () => void;
  onError: (callback: (event: DependencyEvent) => void) => () => void;
  openBrowserUrl: (url: string) => void;
}

const deps: SetupDepsApi = {
  setupComplete: () => {
    ipcRenderer.send('setup-complete');
  },
  hasDotnet6: () => {
    return ipcRenderer.invoke('has-dotnet6');
  },
  ensureInstalled: () => {
    return ipcRenderer.invoke('dependency-ensure-installed');
  },
  onProgress: (callback) => {
    const handleProgress = (event: Electron.IpcRendererEvent, forwardedEvent: DependencyEvent) => {
      callback(forwardedEvent);
    };
    ipcRenderer.on('dependency-progress', handleProgress);

    return () => ipcRenderer.off('dependency-progress', handleProgress);
  },
  onError: (callback) => {
    const handleError = (event: Electron.IpcRendererEvent, forwardedEvent: DependencyEvent) => {
      callback(forwardedEvent);
    };
    ipcRenderer.on('dependency-error', handleError);

    return () => ipcRenderer.off('dependency-progress', handleError);
  },
  openBrowserUrl: (url: string) => ipcRenderer.send('open-browser-url', url),
};

contextBridge.exposeInMainWorld('setupDeps', deps);
