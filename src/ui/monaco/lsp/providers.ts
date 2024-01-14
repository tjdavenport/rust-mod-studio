import maps from './adapter/maps';
import * as converters from './adapter/converters';
import {
  LSPAny,
  CodeAction,
  CodeActionResolveRequest,
  CodeActionRequest,
  CodeActionParams,
  CompletionResolveRequest,
  CompletionRequest,
  CompletionParams,
  CompletionItem,
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const codeActionCache = new Map<monaco.languages.CodeAction, CodeAction>()
export const csharpCodeActionProvider: monaco.languages.CodeActionProvider = {
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
        actions: codeActions.map((codeAction, i) => {
          const provided = converters.codeAction.fromLsp.toCodeAction(codeAction);
          codeActionCache.set(provided, codeAction);
          return provided;
        }),
        dispose: () => {}
      };
    }

    return {
      actions: [],
      dispose: () => {}
    };
  }
};

const completionItemCache = new Map<monaco.languages.CompletionItem, CompletionItem>()
export const csharpCompletionItemProvider: monaco.languages.CompletionItemProvider = {
  triggerCharacters: ['.', ' '],
  resolveCompletionItem: async (monacoCompletionItem) => {
    try {
      const completionItem = await window.lsp.sendRequest<CompletionItem>(
        CompletionResolveRequest.method,
        completionItemCache.get(monacoCompletionItem)
      );
      return converters.completionItem.fromLsp.toCompletionItem(completionItem);
    } catch (error) {
      /**
       * @TODO
       */
      console.error(error);
    }

    return monacoCompletionItem;
  },
  provideCompletionItems: async (model, position, context) => {
    try {
      completionItemCache.clear();

      const completionParams: CompletionParams = {
        textDocument: {
          uri: model.uri.toString(),
        },
        position: {
          line: position.lineNumber - 1,
          character: position.column - 1
        },
        context: {
          triggerCharacter: context.triggerCharacter,
          triggerKind: maps.triggerKind.lsp.get(context.triggerKind)
        },
      };
      const completions = await window.lsp.sendRequest<CompletionItem[]>(
        CompletionRequest.method,
        completionParams
      );

      const suggestions = completions.map((item: CompletionItem) => {
        const monacoCompletionItem = converters.completionItem.fromLsp.toCompletionItem(item);
        completionItemCache.set(monacoCompletionItem, item);
        return monacoCompletionItem;
      });

      return {
        suggestions,
        dispose: () => {}
      };
    } catch (error) {
      /**
       * @TODO
       */
      console.error(error);
      return {
        suggestions: [],
        dispose: () => {}
      };
    }
  },
};
