import { ID } from '../commands/addHook';
import { getCovalenceClassHeaderRange } from '../util';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const oxideRustCodeLensProvider: monaco.languages.CodeLensProvider= {
  provideCodeLenses: (model) => {
    const lenses: monaco.languages.CodeLens[] = [];

    const covalenceClassHeaderRange = getCovalenceClassHeaderRange(model);
    if (covalenceClassHeaderRange) {
      lenses.push({
        range: covalenceClassHeaderRange,
        command: {
          id: ID,
          title: 'Add Hook Handler',
          arguments: [model, covalenceClassHeaderRange]
        }
      });
    }

    return {
      lenses,
      dispose: () => {}
    };
  }
};

export default oxideRustCodeLensProvider;
