import * as converters from '../adapter/converters';
import {
  CodeLens,
  CodeLensRequest,
  CodeLensParams,
  CodeLensResolveRequest,
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const csharpCodeLensProvider: monaco.languages.CodeLensProvider= {
  resolveCodeLens: async (model, codeLens) => {
    const resolved = await window.lsp.sendRequest<CodeLens>(
      CodeLensResolveRequest.method,
      {
        range: converters.range.fromMonaco.toRange(codeLens.range),
        data: model.uri.toString()
      }
    );
    return converters.codeLens.fromLsp.toCodeLens(resolved);
  },
  provideCodeLenses: async (model) => {
    const params: CodeLensParams = {
      textDocument: {
        uri: model.uri.toString()
      }
    };
    const codeLenses = await window.lsp.sendRequest<CodeLens[]>(
      CodeLensRequest.method,
      params
    );

    return {
      lenses: codeLenses.map((codeLens) => {
        return {
          range: converters.range.fromLsp.toRange(codeLens.range)
        }
      }),
      dispose: () => {}
    };
  }
};

export default csharpCodeLensProvider;
