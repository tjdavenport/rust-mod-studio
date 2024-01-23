import { createContext } from 'react';
import { MonacoInstance } from '../../../';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type ReactMonacoTheme = {
  fontFamily: string;
  fontSize: string;

  backgroundColor: string;
  selectedBackgroundColor: string;
  keywordForeground: string;

  widgetBorder: string;
};

export const buildReactMonacoTheme = (editor: monaco.editor.ICodeEditor, instance: MonacoInstance): ReactMonacoTheme => {
  // @ts-ignore: _themeService is not defined on the editor type.
  const themeData: monaco.editor.IStandaloneThemeData = editor._themeService.getColorTheme().themeData;

  return {
    fontFamily: editor.getOption(instance.editor.EditorOption.fontFamily),
    fontSize: `${editor.getOption(instance.editor.EditorOption.fontSize)}px`,

    backgroundColor: themeData.colors['editor.background'],
    selectedBackgroundColor: themeData.colors['editorSuggestWidget.selectedBackground'],
    keywordForeground: `#${themeData.rules.find(rule => rule.token === 'keyword').foreground}`,

    widgetBorder: `${themeData.colors['editorSuggestWidget.border']} 1px solid`,
  };
};

export const ThemeContext = createContext<ReactMonacoTheme>({
  fontFamily: '',
  fontSize: '',

  backgroundColor: '',
  selectedBackgroundColor: '',
  keywordForeground: '',

  widgetBorder: '',
});
