import { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  projectURIs: string[];
};

const Plugin = ({ uri }: { uri: string }) => {
  const navigate = useNavigate();
  const pluginName = uri.split('/').pop();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(`/edit/${encodeURIComponent(uri)}`);
  };

  return (
    <a href="#" onClick={handleClick}>{pluginName}</a>
  );
};

const Home = ({ projectURIs }: HomeProps) => {
  return (
    <div style={{ display: 'flex', marginTop: '48px', justifyContent: 'center' }}>
      <div className="bg-dark-grey" style={{ padding: '16px', borderRadius: '4px', width: '280px', height: '280px' }}>
        <h4>My Plugins</h4>
        {projectURIs.map(uri => {
          return (
            <Plugin key={`plugin-${uri}`} uri={uri}/>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
