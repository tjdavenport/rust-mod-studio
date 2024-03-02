/* @ts-ignore */
import hammer from './images/hammer.png';
import { createRoot } from 'react-dom/client';
import BarLoader from 'react-spinners/BarLoader';
import { DependencyEvent, DependencyName, EventKind } from '../shared';
import { useEffect, useState, CSSProperties, useCallback, MouseEvent } from 'react';

const barLoaderOverride: CSSProperties = {
  width: '100vw',
};
const containerCss: CSSProperties = {
  backgroundImage: `url(${hammer})`,
  height: '100vh',
  width: '100vw',
  backgroundSize: 'cover',
  position: 'relative'
};

type SetupErrorProps = {
  errorEvent: DependencyEvent;
  installedCheckFailed: boolean;
};
const SetupError = ({ errorEvent, installedCheckFailed }: SetupErrorProps) => {
  const displayErrorEvent = errorEvent?.msg && !installedCheckFailed;
  return (
    <div style={{ position: 'absolute', bottom: '0px' }}>
      {displayErrorEvent && (
        <div style={{ padding: '6px 8px' }}><p>{errorEvent?.msg}</p></div>
      )}
      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}>
          <div style={{ padding: '10px 8px' }}>
            <h5 style={{ marginBottom: '4px' }}>
              <span>{'Initial Setup Failed'}</span>
            </h5>
            <small>
              {displayErrorEvent ? (
                `Failed to install ${errorEvent.name}. `
              ) : (
                'Failed to check if dependencies are installed. '
              )}
              Create an issue on the Github repo for support.
            </small>
          </div>
      </div>
    </div>
  );
};

const dotnetInstallUrl = 'https://dotnet.microsoft.com/en-us/download/dotnet/6.0';
const MissingDotnet = ({ startSetup }: { startSetup: () => Promise<void> }) => {
  const handleDotnetAnchorClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.deps.openBrowserUrl(dotnetInstallUrl);
  }, []);
  const handleRetryClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    startSetup();
  }, []);

  return (
    <div style={{ position: 'absolute', bottom: '0px' }}>
      <div style={{ padding: '6px 8px' }}><p>Dotnet 6 Required</p></div>
      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}>
          <div style={{ padding: '10px 8px' }}>
            <h5 style={{ marginBottom: '4px' }}>
              <span>Cannot Start Setup</span>
            </h5>
            <small>
              Rust Mod Studio requires Dotnet Framework 6 or greater. Click <a className="cyan" href="#" onClick={handleDotnetAnchorClick}>here</a> and install Dotnet 6, then <a className="cyan" href="">retry</a> running setup.
            </small>
          </div>
      </div>
    </div>
  );
};

const mockEvent: DependencyEvent = {
  name: DependencyName.OmniSharp,
  kind: EventKind.InstallError,
  msg: 'floop shoop dep whoop',
};

const App = () => {
  const [currentProgress, setCurrentProgress] = useState<DependencyEvent | null>(null);
  const [currentError, setCurrentError] = useState<DependencyEvent | null>(null);
  const [installedCheckFailed, setInstalledCheckFailed] = useState<boolean>(false);
  const [missingDotnet, setMissingDotnet] = useState<true | null>(null);

  const startSetup = useCallback(async () => {
    try {
      if (await window.deps.hasDotnet6()) {
        if (await window.deps.ensureInstalled()) {
          window.deps.setupComplete();
        }
      } else {
        setMissingDotnet(true);
      }
    } catch (error) {
      setInstalledCheckFailed(true);
    }
  }, []);

  useEffect(() => {
    const disposeProgress = window.deps.onProgress((event) => {
      setCurrentProgress(event);
    });
    const disposeError = window.deps.onError((event) => {
      setCurrentError(event);
    });

    startSetup();

    return () => {
      disposeProgress();
      disposeError();
    };
  }, []);

  const shouldShowErrors = currentError || installedCheckFailed;

  if (shouldShowErrors) {
    return (
      <div style={containerCss}>
        <SetupError errorEvent={currentError} installedCheckFailed={false}/>
      </div>
    );
  }

  if (missingDotnet === true) {
    return (
      <div style={containerCss}>
        <MissingDotnet startSetup={startSetup}/>
      </div>
    );
  }

  return (
    <div style={containerCss}>
      <div style={{ position: 'absolute', bottom: '0px' }}>
        <div style={{ padding: '6px 8px' }}><p>{currentProgress?.msg}</p></div>
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}>
          <BarLoader color="#a6e22e" height="6" cssOverride={barLoaderOverride}/>
          <div style={{ padding: '10px 8px' }}>
            <h5 style={{ marginBottom: '4px' }}>
              <span>{'Initial Setup'}</span>
            </h5>
            <small>Please wait while Rust Mod Studio prepares to run for the first time.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('app'));
root.render(<App/>);
