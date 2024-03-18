import Nav from './Nav';
import { useEffect } from 'react';
import EditPage from './pages/Edit';
import HomePage from './pages/Home';
import monokai from './monaco/monokai';
import { DependencyName } from '../shared';
import { createRoot } from 'react-dom/client';
import { statuses } from './hooks/dependencies';
import { useMonaco } from '@monaco-editor/react';
import { useCsharpProjectDir } from './hooks/fs';
import { connectToLSP, connectToMenu } from './monaco';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useRustDedicatedLogWriter } from './hooks/dependencies';

/**
 * @TODO - Considering Redux
 * Objectives where a redux store could be more useful than a state hook.
 * 1. Keeping track of the user's platform. There may be multiple components that need
 * access to knowing the user's platform. As of now, only the DevelopmentServer component
 * needs to know the user's platform.
 * 2. Keeping track of the state of dependency processes. Dependency hooks keep track of
 * the status of dependency processes. The current status must be invoked after those hooks are unmounted.
 * A redux store could keep track of this outside of the component lifecycle, but if there's a need to get 
 * process status from the backend regardless, adding a reducer may not provide any additional utility.
 */
window.mainDeps.onProcessStatus((event) => {
  if (event.name === DependencyName.RustDedicated) {
    statuses.rustDedicated = event.status;
  }
  if (event.name === DependencyName.SteamCMD) {
    statuses.steamCMD = event.status;
  }
});

/**
 * https://www.electronforge.io/config/plugins/webpack#how-do-i-do-virtual-routing
 */
const App = () => {
  const { textFileURIs, read } = useCsharpProjectDir();
  const monaco = useMonaco();

  useRustDedicatedLogWriter();
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('monokai', monokai);
      connectToMenu(monaco);
      connectToLSP(monaco);
    }
  }, [monaco]);

  return (
    <HashRouter>
      <Nav/>
      <Routes>
        <Route path="/" element={(
          <HomePage projectURIs={textFileURIs} read={read} />
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
