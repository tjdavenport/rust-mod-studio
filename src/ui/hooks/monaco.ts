import { useEffect, useState } from 'react';
import { useMonaco } from '@monaco-editor/react';
import { Uri } from 'monaco-editor/esm/vs/editor/editor.api';

export const useLoadedURIs = () => {
  const monaco = useMonaco();
  const [loadedURIs, setLoadedURIs] = useState<Uri[]>([]);

  useEffect(() => {
    if (monaco) {
      const syncModelsState = () => {
        debugger;
        setLoadedURIs(monaco.editor.getModels().map(model => {
          return model.uri;
        }));
      };

      const disposables = [
        monaco.editor.onDidCreateModel(syncModelsState),
        monaco.editor.onWillDisposeModel(syncModelsState),
      ];

      syncModelsState();

      return () => {
        disposables.forEach(disposable => disposable.dispose());
      };
    }
  }, [monaco]);

  return loadedURIs
};
