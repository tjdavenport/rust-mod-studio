import { MonacoInstance } from '../../';
import { addMethodToClass } from '../util';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import * as reactContentWidget from '../contentWidgets/reactContentWidget';
import AddHookWidget, { ID as addHookId } from '../contentWidgets/AddHook';

export const ID = 'oxide.rust.add-hook-handler';

/**
 * https://github.com/microsoft/vscode/blob/main/src/vs/editor/browser/coreCommands.ts
 */
const addHook = (instance: MonacoInstance) => {
  return {
    id: ID,
    run: (event: any, model: monaco.editor.ITextModel, classHeaderRange: monaco.IRange) => {
      for (const editor of instance.editor.getEditors()) {
        if (reactContentWidget.cache.has(addHookId)) {
          editor.removeContentWidget(reactContentWidget.cache.get(addHookId));
          reactContentWidget.cache.delete(addHookId);
        } else {
          const widget = reactContentWidget.create({
            ID: addHookId,
            position: {
              preference: [
                instance.editor.ContentWidgetPositionPreference.BELOW,
                instance.editor.ContentWidgetPositionPreference.ABOVE,
              ],
              position: {
                lineNumber: classHeaderRange.endLineNumber,
                column: classHeaderRange.startColumn,
              }
            },
            instance,
            editor,
            Component: () => {
              return (
                <AddHookWidget
                  onSelect={(insertText) => {
                    addMethodToClass(insertText, classHeaderRange, model);
                    editor.removeContentWidget(reactContentWidget.cache.get(addHookId));
                    reactContentWidget.cache.delete(addHookId);
                  }}
                  width="300px"
                  onBlur={() => {
                    editor.removeContentWidget(reactContentWidget.cache.get(addHookId));
                    reactContentWidget.cache.delete(addHookId);
                  }}
                />
              );
            },
          });
          reactContentWidget.cache.set(addHookId, widget);
          editor.addContentWidget(widget);
        }
        break;
      }
    }
  }
};

export default addHook;
