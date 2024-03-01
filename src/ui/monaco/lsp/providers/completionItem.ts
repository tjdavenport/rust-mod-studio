import maps from '../adapter/maps';
import * as converters from '../adapter/converters';
import {
  CompletionResolveRequest,
  CompletionRequest,
  CompletionParams,
  CompletionItem,
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const completionItemCache = new Map<monaco.languages.CompletionItem, CompletionItem>()
const csharpCompletionItemProvider: monaco.languages.CompletionItemProvider = {
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

export default csharpCompletionItemProvider;
