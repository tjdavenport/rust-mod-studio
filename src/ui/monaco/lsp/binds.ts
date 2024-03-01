import { MonacoInstance } from '../';
import {
  PublishDiagnosticsNotification,
  PublishDiagnosticsParams,
} from 'vscode-languageserver-protocol';
import { uriFuzzyEqual } from '../';
import * as converters from './adapter/converters';

export const bindDiagnosticsNotification = (monaco: MonacoInstance) => {
  window.lsp.onNotification<PublishDiagnosticsParams>(PublishDiagnosticsNotification.method, (params) => {
    const model = monaco.editor.getModels().find(model => {
      return uriFuzzyEqual(params.uri, model.uri.toString());
    });

    if (model) {
      monaco.editor.setModelMarkers(model, 'OmniSharp', params.diagnostics.map(diagnostic => {
        return converters.diagnostic.fromLsp.toMarkerData(diagnostic);
      }));
    }
  });
};
