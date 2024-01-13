import {
  completionItemToMonaco,
  completionItemMap,
  triggerKindMap,
} from './adapter';
import {
  CompletionResolveRequest,
  CompletionRequest,
  CompletionParams,
  CompletionItem,
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const csharpCompletionItemProvider: monaco.languages.CompletionItemProvider = {
  triggerCharacters: ['.', ' '],
  resolveCompletionItem: async (monacoCompletionItem) => {
    try {
      const completionItem = await window.lsp.sendRequest<CompletionItem>(
        CompletionResolveRequest.method,
        completionItemMap.get(monacoCompletionItem)
      );
      return completionItemToMonaco(completionItem);
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
      completionItemMap.clear();

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
          triggerKind: triggerKindMap.get(context.triggerKind)
        },
      };
      const completions = await window.lsp.sendRequest<CompletionItem[]>(
        CompletionRequest.method,
        completionParams
      );

      const suggestions = completions.map((item: CompletionItem) => {
        const monacoCompletionItem = completionItemToMonaco(item)
        completionItemMap.set(monacoCompletionItem, item);
        return monacoCompletionItem;
      });

      return {
        suggestions,
      };
    } catch (error) {
      /**
       * @TODO
       */
      console.error(error);
      return {
        suggestions: []
      };
    }
  },
};
