import {
  DiagnosticSeverity,
  CompletionTriggerKind,
} from 'vscode-languageserver-protocol';
import { MarkerSeverity, languages } from 'monaco-editor/esm/vs/editor/editor.api';

const diagnosticSeverity = () => {
  const monaco = new Map<DiagnosticSeverity, MarkerSeverity>();
  monaco.set(DiagnosticSeverity.Error, MarkerSeverity.Error);
  monaco.set(DiagnosticSeverity.Hint, MarkerSeverity.Hint);
  monaco.set(DiagnosticSeverity.Information, MarkerSeverity.Info);
  monaco.set(DiagnosticSeverity.Warning, MarkerSeverity.Warning);

  const lsp = new Map<MarkerSeverity, DiagnosticSeverity>();
  lsp.set(MarkerSeverity.Error, DiagnosticSeverity.Error);
  lsp.set(MarkerSeverity.Hint, DiagnosticSeverity.Hint);
  lsp.set(MarkerSeverity.Info, DiagnosticSeverity.Information);
  lsp.set(MarkerSeverity.Warning, DiagnosticSeverity.Warning);

  return { monaco, lsp };
};

const triggerKind = () => {
  const lsp = new Map<languages.CompletionTriggerKind, CompletionTriggerKind>();
  lsp.set(
    languages.CompletionTriggerKind.Invoke,
    CompletionTriggerKind.Invoked
  );
  lsp.set(
    languages.CompletionTriggerKind.TriggerCharacter,
    CompletionTriggerKind.TriggerCharacter
  );
  lsp.set(
    languages.CompletionTriggerKind.TriggerForIncompleteCompletions,
    CompletionTriggerKind.TriggerForIncompleteCompletions
  );

  return { lsp };
};

export default {
  diagnosticSeverity: diagnosticSeverity(),
  triggerKind: triggerKind(),
};
