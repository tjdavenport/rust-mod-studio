import * as lspBinds from './lsp/binds';
import { MenuItemId } from '../../shared';
import * as menuHandlers from './menu';
import { PathMatch } from 'react-router-dom';
import * as lspHandlers from './lsp/handlers';
import * as lspProviders from './lsp/providers';
import * as oxideRustCommands from './oxide.rust/commands';
import * as oxideRustProviders from './oxide.rust/providers';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type MonacoInstance = typeof monaco;
export type EditorInstance = typeof monaco.editor;

/**
 * Monaco doesn't properly decode URIs when those URIs contain windows-style
 * drive prefixes e.g C:/ or Z:/, so a manual fluffy check is needed.
 */
export const uriFuzzyEqual = (uriA: string | undefined | null, uriB: string | undefined | null) => {
  if (typeof uriA !== 'string' || typeof uriB !== 'string') {
    return false;
  }

  return decodeURIComponent(uriA).toLowerCase() === decodeURIComponent(uriB).toLowerCase();
};

export const connectToMenu = (monaco: MonacoInstance) => {
  window.appMenu.onClick(MenuItemId.Save, menuHandlers.handleAppMenuSave(monaco));
  window.appMenu.onClick(MenuItemId.Find, menuHandlers.handleAppMenuFind(monaco));
  window.appMenu.onClick(MenuItemId.CmdPalette, menuHandlers.handleAppMenuCmdPalette(monaco));
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
