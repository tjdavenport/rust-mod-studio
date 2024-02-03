import * as lspBinds from './lsp/binds';
import { MenuItemId } from '../../shared';
import * as fsHandlers from './fs/handlers';
import * as lspHandlers from './lsp/handlers';
import * as lspProviders from './lsp/providers';
import * as oxideRustCommands from './oxide.rust/commands';
import * as oxideRustProviders from './oxide.rust/providers';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type MonacoInstance = typeof monaco;
export type EditorInstance = typeof monaco.editor;

export const connectToFs = (monaco: MonacoInstance) => {
  window.appMenu.onClick(MenuItemId.Save, fsHandlers.handleAppMenuSave(monaco));
};

export const connectToLSP = (monaco: MonacoInstance) => {
  oxideRustCommands.registerAll(monaco);

  monaco.languages.registerCodeLensProvider('csharp', oxideRustProviders.codeLens);
  monaco.languages.registerCompletionItemProvider('csharp', lspProviders.completionItem);
  //monaco.languages.registerCompletionItemProvider('csharp', oxideRustProviders.completionItem);
  monaco.languages.registerCodeActionProvider('csharp', lspProviders.codeAction);

  monaco.editor.onDidCreateModel(lspHandlers.handleDidCreateModel);
  monaco.editor.onWillDisposeModel(lspHandlers.handleWillDisposeModel);
  lspBinds.bindDiagnosticsNotification(monaco);
  window.appMenu.onClick(MenuItemId.Save, lspHandlers.handleAppMenuSave(monaco));
};
