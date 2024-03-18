import { useEffect } from 'react';
import Plugins, { PluginsProps } from './Plugins';
import DevelopmentServer from './DevelopmentServer';

type HomeProps = PluginsProps & {
  read: () => void;
}

const Home = ({ projectURIs, read }: HomeProps) => {

  useEffect(() => {
    read();
  }, []);

  return (
    <div style={{ display: 'flex', padding: '12px', gap: '14px' }}>
      <Plugins projectURIs={projectURIs} read={read} />
      <DevelopmentServer/>
    </div>
  );
};

export default Home;
