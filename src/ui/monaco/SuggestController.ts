import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

/**
 * SuggestController is not exposed by the vscode module
 *
 * https://github.com/microsoft/vscode/blob/main/src/vs/editor/contrib/suggest/browser/suggestController.ts
 */
export class SuggestController implements monaco.editor.IEditorContribution {
  public static readonly ID: string = 'editor.contrib.suggestController';
  triggerSuggest(onlyFrom?: Set<monaco.languages.CompletionItemProvider>, auto?: boolean, noFilter?: boolean): void {
  }
  dispose() {}
}
