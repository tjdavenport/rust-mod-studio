import { createRoot } from 'react-dom/client';
import { useDependencyState } from './hooks/dependencies';

const App = () => {
  const { dependencyState, loadState } = useDependencyState();

  return (
    <div>{JSON.stringify(dependencyState)}</div>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App/>);
