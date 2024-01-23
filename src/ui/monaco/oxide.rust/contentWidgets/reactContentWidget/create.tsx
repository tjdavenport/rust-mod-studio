import { FC } from 'react';
import { WrapperProps } from './';
import { MonacoInstance } from '../../../';
import { createRoot } from 'react-dom/client';
import { ThemeContext, buildReactMonacoTheme } from './theme';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export type ReactContentWidget = monaco.editor.IContentWidget & {
  reactRendered: boolean;
};

type ReactContentWidgetOptions = {
  ID: string;
  position: monaco.editor.IContentWidgetPosition;
  editor: monaco.editor.ICodeEditor;
  instance: MonacoInstance;
  Component: FC
};

export default ({ ID, position, editor, instance, Component }: ReactContentWidgetOptions): ReactContentWidget => {
  const theme = buildReactMonacoTheme(editor, instance);

  return {
    reactRendered: false,
    getPosition() {
      return position;
    },
    afterRender() {
      if (!this.reactRendered) {
        const root = createRoot(this.domNode);
        root.render(
          <ThemeContext.Provider value={theme}>
            <Component/>
          </ThemeContext.Provider>
        );
        this.reactRendered = true;
      }
    },
    getDomNode() {
      if (!this.domNode) {
        const node = document.createElement('div');
        this.domNode = node;
      }
      return this.domNode;
    },
    getId() {
      return ID;
    }
  };
};
