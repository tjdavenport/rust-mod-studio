import { Pane } from './components';

type DevelopmentServerProps = {
  platform: string;
};

const DevelopmentServer = ({ platform }: DevelopmentServerProps) => {
  if (platform === 'darwin') {
    return (
      <Pane className="bg-dark-grey">
        <h4 style={{ marginBottom: '12px' }}>Rust Development Server</h4>
        {platform === 'darwin' && (
          <p>Rust Dedicated Server is not supported on OSX. Support via Docker is coming soon.</p>
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
