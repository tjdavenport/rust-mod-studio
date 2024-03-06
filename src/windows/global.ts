import {
  SystemApi,
  MainDepsApi,
  LspApi,
  FsApi,
  AppMenuApi,
} from './main/preload';
import { SetupDepsApi } from './setup/preload';

declare global {
  interface Window {
    system: SystemApi,
    setupDeps: SetupDepsApi,
    mainDeps: MainDepsApi,
    lsp: LspApi 
    fs: FsApi
    appMenu: AppMenuApi,
    electronAPI: {
      hasDotnet: () => Promise<boolean>;
      hasSteamCmd: () => Promise<boolean>;
      hasOmniSharp: () => Promise<boolean>;
      openBrowserUrl: (url: string) => void;
    };
  }
}
