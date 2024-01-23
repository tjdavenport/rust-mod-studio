import * as converters from '../adapter/converters';
import {
  CodeAction,
  CodeActionResolveRequest,
  CodeActionRequest,
  CodeActionParams,
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const codeActionCache = new Map<monaco.languages.CodeAction, CodeAction>()
const csharpCodeActionProvider: monaco.languages.CodeActionProvider = {
  resolveCodeAction: async (codeAction) => {
    const cachedCodeAction = codeActionCache.get(codeAction);
    const resolved = await window.lsp.sendRequest<CodeAction>(
      CodeActionResolveRequest.method,
      cachedCodeAction
    );
    return converters.codeAction.fromLsp.toCodeAction(resolved);
  },
  provideCodeActions: async (model, range, context) => {
    codeActionCache.clear();

    try {
      if (context.markers.length > 0) {
        const diagnostics = context.markers.map(marker => {
          return converters.marker.fromMonaco.toDiagnostic(marker);
        });
        const params: CodeActionParams = {
          textDocument: {
            uri: model.uri.toString(),
          },
          range: converters.range.fromMonaco.toRange(range),
          context: {
            diagnostics: diagnostics
          },
        };
        const codeActions = await window.lsp.sendRequest<CodeAction[]>(
          CodeActionRequest.method,
          params
        );

        return {
          actions: codeActions.map((codeAction) => {
            const provided = converters.codeAction.fromLsp.toCodeAction(codeAction);
            codeActionCache.set(provided, codeAction);
            return provided;
          }),
          dispose: () => {}
        };
      }
    } catch (error) {
      console.error(error);
    }

    return {
      actions: [],
      dispose: () => {}
    };
  }
};

export default csharpCodeActionProvider;
