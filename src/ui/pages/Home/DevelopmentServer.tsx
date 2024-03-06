import { Pane } from './components';
import { OxideTags } from '../../../shared';
import { usePlatform } from '../../hooks/system';
import BarLoader from 'react-spinners/BarLoader';
import { GoAlertFill, GoSync } from 'react-icons/go';
import { useCallback, MouseEvent, CSSProperties } from 'react';
import { useOxideRustTags, useOxideRustUpdater } from '../../hooks/dependencies';

const barLoaderOverride: CSSProperties = {
  width: '100%',
};

const OxideVersionLine = () => {
  const { refreshing, tags, refresh } = useOxideRustTags();
  const { working, failed, update } = useOxideRustUpdater();

  const updateAvailable = (tags.artifact !== tags.latestAsset) &&
    tags.latestAsset !== '';
  const handleUpdateClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    update().then(() => {
      refresh();
    });
  }, []);

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
    <Pane className="bg-dark-grey">
      <h4 style={{ marginBottom: '12px' }}>Rust Development Server</h4>
    </Pane>
  );
};

export default DevelopmentServer;
