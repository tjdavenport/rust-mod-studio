import Nav from './Nav';
import { useEffect } from 'react';
import EditPage from './pages/Edit';
import HomePage from './pages/Home';
import monokai from './monaco/monokai';
import { createRoot } from 'react-dom/client';
import { useMonaco } from '@monaco-editor/react';
import { useCsharpProjectDir } from './hooks/fs';
import { connectToLSP, connectToFs } from './monaco';
import { HashRouter, Routes, Route } from 'react-router-dom';

const App = () => {
  const { textFileURIs, add } = useCsharpProjectDir();
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('monokai', monokai);
      connectToFs(monaco);
      connectToLSP(monaco);
    }
  }, [monaco]);

  return (
    <HashRouter>
      <Nav/>
      <Routes>
        <Route path="/" element={(
          <HomePage projectURIs={textFileURIs} />
        )}/>
        <Route path="/edit/:uri" element={(
          monaco && <EditPage/>
        )}/>
      </Routes>
    </HashRouter>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App/>);
