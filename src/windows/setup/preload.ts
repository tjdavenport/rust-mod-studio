import { ipcRenderer, contextBridge } from 'electron';
import { DependencyState, DependencyEvent } from '../../shared';

interface DepsApi {
  setupComplete: () => void;
  ensureInstalled: () => Promise<boolean>;
  onProgress: (callback: (event: DependencyEvent) => void) => () => void;
  onError: (callback: (event: DependencyEvent) => void) => () => void;
}

const deps: DepsApi = {
  setupComplete: () => {
    ipcRenderer.send('setup-complete');
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
};

declare global {
  interface Window {
    deps: DepsApi
  }
}

contextBridge.exposeInMainWorld('deps', deps);
