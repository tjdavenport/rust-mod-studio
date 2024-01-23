import { MonacoInstance } from '../monaco';
import { useCsharpProjectFile } from '../hooks/fs';
import Monaco from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

type EditorProps = {
  uri: string;
};

const Editor = ({ uri }: EditorProps) => {
  const handleOnMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: MonacoInstance) => {
    monaco.editor.setTheme('monokai');
  };
  const content = useCsharpProjectFile(uri);

  if (content !== null) {
    return (
      <Monaco
        path={uri}
        keepCurrentModel
        height="calc(100vh - 48px)"
        defaultValue={content}
        language="csharp"
        onMount={handleOnMount}
      />
    );
  }

  return <>Loading Indicator</>
};

export default Editor;
