import { DependencyState } from '../../shared';
import { ipcRenderer, contextBridge } from 'electron';

interface DepsApi {
  getState: () => Promise<DependencyState>;
}

const deps: DepsApi = {
  getState: () => {
    return ipcRenderer.invoke('deps-get-state');
  },
};

declare global {
  interface Window {
    deps: DepsApi
  }
}

contextBridge.exposeInMainWorld('deps', deps);
