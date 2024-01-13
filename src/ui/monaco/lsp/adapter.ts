import {
  Diagnostic,
  CompletionItem,
  DiagnosticSeverity,
  CompletionTriggerKind,
  TextEdit,
  MarkupKind,
  MarkupContent
} from 'vscode-languageserver-protocol';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const triggerKindMap = new Map<monaco.languages.CompletionTriggerKind, CompletionTriggerKind>();
triggerKindMap.set(
  monaco.languages.CompletionTriggerKind.Invoke,
  CompletionTriggerKind.Invoked
);
triggerKindMap.set(
  monaco.languages.CompletionTriggerKind.TriggerCharacter,
  CompletionTriggerKind.TriggerCharacter
);
triggerKindMap.set(
  monaco.languages.CompletionTriggerKind.TriggerForIncompleteCompletions,
  CompletionTriggerKind.TriggerForIncompleteCompletions
);

const completionItemMap = new Map<monaco.languages.CompletionItem, CompletionItem>()

const severityMap = new Map<DiagnosticSeverity, monaco.MarkerSeverity>();
severityMap.set(DiagnosticSeverity.Error, monaco.MarkerSeverity.Error);
severityMap.set(DiagnosticSeverity.Hint, monaco.MarkerSeverity.Hint);
severityMap.set(DiagnosticSeverity.Information, monaco.MarkerSeverity.Info);
severityMap.set(DiagnosticSeverity.Warning, monaco.MarkerSeverity.Warning);

const diagnosticToMonaco = (diagnostic: Diagnostic): monaco.editor.IMarkerData => {
  return {
    severity: severityMap.get(diagnostic.severity),
    message: diagnostic.message,
    startLineNumber: diagnostic.range.start.line + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endColumn: diagnostic.range.end.character + 1, 
  }
};

const completionItemToMonaco = (item: CompletionItem): monaco.languages.CompletionItem => {
  const textEdit = item.textEdit as TextEdit;
  const monacoCompletionItem: monaco.languages.CompletionItem = {
    label: item.label,
    kind: item.kind,
    insertText: item.textEdit.newText,
    range: new monaco.Range(
      textEdit.range.start.line + 1,
      textEdit.range.start.character + 1,
      textEdit.range.end.line + 1,
      textEdit.range.end.character + 1
    )
  };

  const isMarkdownDocumentation = item.documentation instanceof Object
    && 'kind' in item.documentation
    && item.documentation.kind === MarkupKind.Markdown
  const isStringDocumentation = item.documentation instanceof String;

  if (isStringDocumentation) {
    monacoCompletionItem.documentation = item.documentation;
  } else if (isMarkdownDocumentation) {
    monacoCompletionItem.documentation = {
      value: (item.documentation as MarkupContent).value
    };
  }

  return monacoCompletionItem;
};

export {
  diagnosticToMonaco,
  completionItemToMonaco,
  completionItemMap,
  triggerKindMap,
  severityMap,
};
