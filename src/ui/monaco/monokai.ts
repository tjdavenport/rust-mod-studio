import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const monokai: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'f92672' },
    { token: 'variable.language', foreground: '66d9ef' },
    { token: 'variable.other', foreground: 'f8f8f2' },
    { token: 'variable.parameter', foreground: 'a6e22e' },
    { token: 'constant.language', foreground: '66d9ef' },
    { token: 'constant.numeric', foreground: 'ae81ff' },
    { token: 'constant.character', foreground: 'ae81ff' },
    { token: 'constant.language.boolean', foreground: 'ae81ff' },
    { token: 'string', foreground: 'e6db74' },
    { token: 'support.function', foreground: 'a6e22e' },
    { token: 'entity.name.function', foreground: 'a6e22e' },
    { token: 'entity.name.tag', foreground: 'f92672' },
    { token: 'meta.selector', foreground: 'f92672' },
    { token: 'entity.other.attribute-name', foreground: 'a6e22e' },
  ],
  colors: {
    'editor.background': '#272822',
    'editor.foreground': '#F8F8F2',
    'editorLineNumber.foreground': '#75715e',
    'editorLineNumber.activeForeground': '#F8F8F2',
    'editorCursor.foreground': '#F8F8F0',
    'editor.selectionBackground': '#49483e',
    'editor.inactiveSelectionBackground': '#49483e',
    'editorIndentGuide.background': '#75715e',
    'editor.lineHighlightBackground': '#3e3d32',
    'editor.findMatchBackground': '#ae81ff',
    'editor.hoverHighlightBackground': '#3e3d32',
    'editorHoverWidget.background': '#272822',
    'editorHoverWidget.border': '#75715e',
    'editorSuggestWidget.background': '#272822',
    'editorSuggestWidget.border': '#75715e',
    'editorSuggestWidget.selectedBackground': '#49483e',
  }
};

export default monokai;
