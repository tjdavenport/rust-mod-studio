import * as lspBinds from './lsp/binds';
import * as fsHandlers from './fs/handlers';
import { MenuItemId } from '../../constants';
import * as lspHandlers from './lsp/handlers';
import * as lspProviders from './lsp/providers';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type MonacoInstance = typeof monaco;

export const connectToFs = (monaco: MonacoInstance) => {
  window.appMenu.onClick(MenuItemId.Save, fsHandlers.handleAppMenuSave(monaco));
};

export const connectToLSP = (monaco: MonacoInstance) => {
  monaco.languages.registerCompletionItemProvider('csharp', lspProviders.csharpCompletionItemProvider);
  monaco.editor.onDidCreateModel(lspHandlers.handleDidCreateModel);
  monaco.editor.onWillDisposeModel(lspHandlers.handleWillDisposeModel);
  lspBinds.bindDiagnosticsNotification(monaco);
  window.appMenu.onClick(MenuItemId.Save, lspHandlers.handleAppMenuSave(monaco));
};
