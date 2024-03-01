/* @ts-ignore */
import hammer from './images/hammer.png';
import { DependencyEvent } from '../shared';
import { createRoot } from 'react-dom/client';
import BarLoader from 'react-spinners/BarLoader';
import { useEffect, useState, CSSProperties } from 'react';

const barLoaderOverride: CSSProperties = {
  width: '100vw',
};

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
        if (completed) {
          window.deps.setupComplete();
        }
      }).catch(error => {
        // @TODO
      })

    return () => {
      disposeProgress();
      disposeError();
    };
  }, []);

  return (
    <div style={{ backgroundImage: `url(${hammer})`, height: '100vh', width: '100vw', backgroundSize: 'cover', position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: '0px' }}>
        {currentError ? (
          <div style={{ padding: '6px 8px' }}><p>{currentError?.msg}</p></div>
        ) : (
          <div style={{ padding: '6px 8px' }}><p>{currentProgress?.msg}</p></div>
        )}
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}>
          {!currentError && <BarLoader color="#a6e22e" height="6" cssOverride={barLoaderOverride}/>}
          <div style={{ padding: '10px 8px' }}>
            <h5 style={{ marginBottom: '4px' }}>
              {currentError ? (
                <span>{'Initial Setup Failed'}</span>
              ) : (
                <span>{'Initial Setup'}</span>
              )}
            </h5>
            {currentError ? (
              <small>Create an issue on the Github repo for support.</small>
            ) : (
              <small>Please wait while Rust Mod Studio prepares to run for the first time.</small>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App/>);
