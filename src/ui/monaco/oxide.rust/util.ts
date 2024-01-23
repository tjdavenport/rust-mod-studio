import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export const COVALENCE_PLUGIN_CLASS_HEADER = /class\s+[a-zA-Z_]\w*\s*:\s*CovalencePlugin\s*\{/;
export const getCovalenceClassHeaderRange = (model: monaco.editor.ITextModel): monaco.IRange | null => {
  const match = model.getValue().match(COVALENCE_PLUGIN_CLASS_HEADER);

  if (match) {
    const startPosition = model.getPositionAt(match.index);
    const endPosition = model.getPositionAt(match.index + (match[0].length));

    return {
      startLineNumber: startPosition.lineNumber,
      startColumn: startPosition.column,
      endLineNumber: endPosition.lineNumber,
      endColumn: endPosition.column
    };
  }

  return null;
};

export const addMethodToClass = (
  insertText: string,
  classHeaderRange: monaco.IRange,
  model: monaco.editor.ITextModel
) => {
  const openBracePosition = {
    lineNumber: classHeaderRange.endLineNumber,
    column: classHeaderRange.endColumn
  };

  const classIndentSize = model.getLineFirstNonWhitespaceColumn(classHeaderRange.startLineNumber);
  const tabSize = model.getOptions().tabSize;
  const indentedInsertText = '\n' +
    ' '.repeat(classIndentSize + tabSize - 1) +
    insertText.replace(/\n/g, `\n${' '.repeat(classIndentSize + tabSize - 1)}`, )

  model.pushEditOperations(
    [],
    [{
      range: {
        startLineNumber: openBracePosition.lineNumber,
        startColumn: openBracePosition.column,
        endLineNumber: openBracePosition.lineNumber,
        endColumn: openBracePosition.column
      },
      text: indentedInsertText
    }],
    () => []
  );
};
