import { useEffect } from 'react';
import { Pane } from './components';
import { usePlatform } from '../../hooks/system';
import Plugins, { PluginsProps } from './Plugins';
import DevelopmentServer from './DevelopmentServer';

type HomeProps = PluginsProps & {
  read: () => void;
}

const Home = ({ projectURIs, read }: HomeProps) => {
  const platform = usePlatform();
  useEffect(() => {
    read();
  }, []);

  return (
    <div style={{ display: 'flex', padding: '12px', gap: '14px' }}>
      <Plugins projectURIs={projectURIs}/>
      <DevelopmentServer platform={platform}/>
    </div>
  );
};

export default Home;
