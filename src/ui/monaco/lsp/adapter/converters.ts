import {
  WorkspaceEdit,
  LSPAny,
  CodeAction,
  Diagnostic,
  CompletionItem,
  TextEdit,
  MarkupKind,
  MarkupContent,
  Range
} from 'vscode-languageserver-protocol';
import maps from './maps';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const codeAction = {
  fromLsp: {
    toCodeAction: (codeAction: CodeAction): monaco.languages.CodeAction => {
      const { title, kind, isPreferred, edit } = codeAction;

      return {
        title,
        kind,
        edit: edit ? workspaceEdit.fromLsp.toWorkspaceEdit(edit) : undefined,
        isPreferred,
      };
    },
  },
};

export const workspaceEdit = {
  fromLsp: {
    toWorkspaceEdit: (workspaceEdit: WorkspaceEdit): monaco.languages.WorkspaceEdit => {
      if (workspaceEdit?.changes) {
        return {
          edits: Object.entries(workspaceEdit.changes).map(([uri, textEdits]) => {
            const workspaceEdits = textEdits.map((textEdit) => {
              return {
                resource: monaco.Uri.parse(uri),
                versionId: undefined,
                textEdit: {
                  range: range.fromLsp.toRange(textEdit.range),
                  text: textEdit.newText
                }
              };
            });

            return workspaceEdits;
          }).flat()
        };
      }

      return { edits: [] };
    }
  }
};

export const diagnostic = {
  fromLsp: {
    toMarkerData: (diagnostic: Diagnostic): monaco.editor.IMarkerData => {
      return {
        severity: maps.diagnosticSeverity.monaco.get(diagnostic.severity),
        code: diagnostic.code ? String(diagnostic.code) : undefined,
        message: diagnostic.message,
        startLineNumber: diagnostic.range.start.line + 1,
        endLineNumber: diagnostic.range.end.line + 1,
        startColumn: diagnostic.range.start.character + 1,
        endColumn: diagnostic.range.end.character + 1, 
      }
    },
  }
};

export const range = {
  fromMonaco: {
    toRange: (range: monaco.Range | monaco.IRange): Range => {
      return {
        start: {
          line: range.startLineNumber - 1,
          character: range.startColumn - 1,
        },
        end: {
          line: range.endLineNumber - 1,
          character: range.endColumn - 1,
        }
      }
    },
  },
  fromLsp: {
    toRange: (range: Range): monaco.IRange => {
      return {
        startLineNumber: range.start.line + 1,
        startColumn: range.start.character + 1,
        endLineNumber: range.end.line + 1,
        endColumn: range.end.character + 1,
      };
    }
  }
};

export const completionItem = {
  fromLsp: {
    toCompletionItem: (item: CompletionItem): monaco.languages.CompletionItem => {
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
    },
  }
};

export const marker = {
  fromMonaco: {
    toDiagnostic: (marker: monaco.editor.IMarkerData): Diagnostic => {
      const {
        source,
        severity,
        code,
        message,
        startLineNumber,
        startColumn,
        endLineNumber,
        endColumn
      } = marker;

      return {
        source,
        severity: maps.diagnosticSeverity.lsp.get(severity),
        code: code ? String(code) : undefined,
        message,
        range: range.fromMonaco.toRange({
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn
        }),
      };
    }
  }
};
