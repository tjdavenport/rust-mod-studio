import { uriFuzzyEqual } from '../';
import { MonacoInstance } from '../';
import {
  DidSaveTextDocumentNotification,
  DidSaveTextDocumentParams,
  DidOpenTextDocumentNotification,
  DidOpenTextDocumentParams,
  DidCloseTextDocumentNotification,
  DidCloseTextDocumentParams,
  DidChangeTextDocumentNotification,
  DidChangeTextDocumentParams,
} from 'vscode-languageserver-protocol';
import { matchPath } from 'react-router-dom';
import { MenuClickParams } from '../../../shared';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const handleWillDisposeModel = (model: monaco.editor.ITextModel) => {
  const params: DidCloseTextDocumentParams = {
    textDocument: {
      uri: model.uri.toString()
    }
  };
  window.lsp.sendNotification(
    DidCloseTextDocumentNotification.method,
    params,
  );
};

export const handleDidCreateModel = (model: monaco.editor.ITextModel) => {
  model.onDidChangeContent(() => {
    const params: DidChangeTextDocumentParams = {
      textDocument: {
        uri: model.uri.toString(),
        version: model.getVersionId(),
      },
      contentChanges: [{
        text: model.getValue()
      }]
    };
    window.lsp.sendNotification(
      DidChangeTextDocumentNotification.method,
      params
    );
  });

  const params: DidOpenTextDocumentParams = {
    textDocument: {
      uri: model.uri.toString(),
      languageId: 'csharp',
      version: model.getVersionId(),
      text: model.getValue()
    },
  };
  window.lsp.sendNotification(
    DidOpenTextDocumentNotification.method,
    params
  );
};

export const handleAppMenuSave = (monaco: MonacoInstance) => (params: MenuClickParams) => {
  if (params.pathname) {
    const match = matchPath('/edit/:uri', params.pathname);

    if (match?.params?.uri) {
      const model = monaco.editor.getModels().find((model) => {
        return uriFuzzyEqual(model.uri.toString(), match.params.uri);
      });

      if (model) {
        const params: DidSaveTextDocumentParams = {
          textDocument: {
            uri: match.params.uri
          },
          text: model.getValue()
        };
        window.lsp.sendNotification(
          DidSaveTextDocumentNotification.method,
          params
        );
      }
    }
  }
};
