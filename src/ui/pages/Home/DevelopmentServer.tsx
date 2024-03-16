import { Pane } from './components';
import styled from 'styled-components';
import { usePlatform } from '../../hooks/system';
import BarLoader from 'react-spinners/BarLoader';
import { GoAlertFill, GoSync } from 'react-icons/go';
import { ProcessStatus, DependencyName } from '../../../shared';
import { useCallback, MouseEvent, CSSProperties, useRef, useEffect, useState } from 'react';
import { useOxideRustTags, useOxideRustUpdater, useRustDedicatedController, useStatusMonitor, getLogsEl } from '../../hooks/dependencies';

const ServerOutput = styled.textarea`
  background-color: #000;
  color: #fff;
  min-width: 700px;
  height: 250px;
  margin-bottom: 8px;
`;

const barLoaderOverride: CSSProperties = {
  width: '100%',
};

const statusClasses = new Map<ProcessStatus, string>();
statusClasses.set(ProcessStatus.Stopped, '');
statusClasses.set(ProcessStatus.Starting, 'yellow');
statusClasses.set(ProcessStatus.Stopping, 'yellow');
statusClasses.set(ProcessStatus.Running, 'green');

const StatusLine = ({ status }: { status: ProcessStatus }) => {
  if (status === null) {
    return (
      <p>Status: unknown</p>
    );
  }

  if (status === ProcessStatus.Running) {
    return (
      <>
        <p>Status: <span className={statusClasses.get(status)}>{status}</span></p>
        <p>Connect command: <span style={{ backgroundColor: '#000', padding: '2px 8px' }}>connect 127.0.0.1:28015</span></p> 
      </>
    );
  }

  return (
    <p>Status: <span className={statusClasses.get(status)}>{status}</span></p>
  );
};

const updateWarning = `Updating Oxide requires an update of Rust Dedicated server. Rust Dedicated server will stop and will take some time to update. Are you sure?`;
const OxideVersionLine = () => {
  const status = useStatusMonitor(DependencyName.SteamCMD);
  const rustDedicatedStatus = useStatusMonitor(DependencyName.RustDedicated);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const { refreshing, tags, refresh } = useOxideRustTags();
  const { working, failed, update } = useOxideRustUpdater();
  const { stop } = useRustDedicatedController({});

  const updateAvailable = (tags.artifact !== tags.latestAsset) &&
    tags.latestAsset !== '';
  const handleUpdateClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    const runUpdates = () => {
      setIsUpdating(true);
      stop()
        .then((success) => {
          if (success) {
            return window.mainDeps.updateRustDedicated();
          } else {
            setIsUpdating(false);
          }
        }).then((success) => {
          if (success) {
            return update();
          } else {
            setIsUpdating(false);
          }
        }).then(() => {
          setIsUpdating(false);
          refresh();
        });
    };
    event.preventDefault();

    if ([ProcessStatus.Running, ProcessStatus.Starting].includes(rustDedicatedStatus)) {
      if (confirm(updateWarning)) {
        runUpdates();
      }
    } else {
      runUpdates();
    }

  }, [rustDedicatedStatus]);

  if (rustDedicatedStatus === ProcessStatus.Stopping && isUpdating) {
    return (
      <>
        <p style={{ marginBottom: '8px' }}>Stopping Rust Dedicated...</p>
        <BarLoader color="#66d9ef" height="6px" cssOverride={barLoaderOverride}/>
      </>
    );
  }

  if (status === ProcessStatus.Running || isUpdating) {
    return (
      <>
        <p style={{ marginBottom: '8px' }}>Updating Rust Dedicated...</p>
        <BarLoader color="#66d9ef" height="6px" cssOverride={barLoaderOverride}/>
      </>
    );
  }

  if (refreshing && updateAvailable) {
    return (
      <p>
        <GoSync style={{ marginRight: '8px' }}/>
        Syncing Oxide Versions
      </p>
    );
  }

  if (failed) {
    return (
      <p>
        <GoAlertFill className="cardinal" style={{ marginRight: '8px' }}/>
        Failed to update Oxide - <a className="cyan" href="#" onClick={handleUpdateClick}>Retry {tags.latestAsset}</a>
      </p>
    );
  }

  if (working) {
    return (
      <>
        <p style={{ marginBottom: '8px' }}>Updating Oxide...</p>
        <BarLoader color="#66d9ef" height="6px" cssOverride={barLoaderOverride}/>
      </>
    );
  }

  if (updateAvailable) {
    return (
      <p>
        <GoAlertFill className="yellow" style={{ marginRight: '8px' }}/>
        Oxide Update Available: <a className="cyan" href="#" onClick={handleUpdateClick}>Install {tags.latestAsset}</a>
      </p>
    );
  }

  return (
    <p>Oxide Version: <span className="green">{`${tags.artifact}` || 'unknown'}</span></p>
  );
};

const DevelopmentServer = () => {
  const platform = usePlatform();
  const serverOutputRef = useRef<HTMLTextAreaElement>();
  const { start, stop } = useRustDedicatedController({
    onRustDedicatedStdout: (outStr: string) => {
      console.log(outStr.length);
      serverOutputRef.current.value += outStr;
      serverOutputRef.current.scrollTo(0, serverOutputRef.current.scrollHeight);
    }
  });
  const status = useStatusMonitor(DependencyName.RustDedicated);
  const steamCMDStatus = useStatusMonitor(DependencyName.SteamCMD);

  useEffect(() => {
    const helpText = 'Welcome to Rust Mod Studio. This is the console output for the development server. Click the "start server" to the bottom right to start developing your plugins in real time.';
    serverOutputRef.current.value = helpText + "\n" + getLogsEl().value;
    serverOutputRef.current.scrollTo(0, serverOutputRef.current.scrollHeight);
  }, []);

  if (platform === 'darwin') {
    return (
      <Pane className="bg-dark-grey">
        <h4 style={{ marginBottom: '12px' }}>Rust Development Server</h4>
        <OxideVersionLine/>
        <br/>
        {platform === 'darwin' && (
          <p>Rust Dedicated Server is not supported on OSX. Development server integration via Docker is coming soon.</p>
        )}
      </Pane>
    );
  }

  return (
    <Pane maxWidth={'75%'} className="bg-dark-grey">
      <h4 style={{ marginBottom: '12px' }}>Rust Development Server</h4>
      <OxideVersionLine/>
      <br/>
      <ServerOutput ref={serverOutputRef} readOnly/>
      <div style={{ display: 'flex' }}>
        <div style={{ flexGrow: 1 }}>
          {<StatusLine status={status}/>}
        </div>
        <div>
          <button
            onClick={() => start()}
            type="button"
            disabled={[ProcessStatus.Starting, ProcessStatus.Running, null].includes(status) || steamCMDStatus === ProcessStatus.Running}
          >
              start server
            </button>
          <button
            onClick={() => stop()}
            type="button"
            disabled={[ProcessStatus.Stopped, ProcessStatus.Stopping, null].includes(status)}
          >
            stop server
          </button>
        </div>
      </div>
    </Pane>
  );
};

export default DevelopmentServer;
