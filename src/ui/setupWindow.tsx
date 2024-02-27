import { useEffect, useState } from 'react';
import { DependencyEvent } from '../shared';
import { createRoot } from 'react-dom/client';

const App = () => {
  const [currentProgress, setCurrentProgress] = useState<DependencyEvent | null>(null);
  const [currentError, setCurrentError] = useState<DependencyEvent | null>(null);

  useEffect(() => {
    const disposeProgress = window.deps.onProgress((event) => {
      setCurrentProgress(event);
    });
    const disposeError = window.deps.onError((event) => {
      setCurrentError(event);
    });

    window.deps.ensureInstalled()
      .then((completed) => {
        // @TODO - handle completion or incompletion
      });

    return () => {
      disposeProgress();
      disposeError();
    };
  }, []);

  return (
    <div>
      {currentProgress?.msg}
      <br/>
      {currentError?.msg}
    </div>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App/>);
