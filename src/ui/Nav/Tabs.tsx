import { GoX } from 'react-icons/go';
import { useCallback, MouseEvent } from 'react';
import { useLoadedURIs } from '../hooks/monaco';
import { useMonaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useNavigate, matchPath, useLocation } from 'react-router-dom';

const Tab = ({ uri, precedingURI }: { uri: monaco.Uri, precedingURI: monaco.Uri }) => {
  const navigate = useNavigate();
  const monaco = useMonaco();
  const location = useLocation();
  const match = matchPath('/edit/:uri', location.pathname);

  const handleURIClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(`/edit/${encodeURIComponent(uri.toString())}`)
  }, []);

  const handleGoXClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (monaco && precedingURI) {
      navigate(`/edit/${encodeURIComponent(precedingURI.toString())}`)
    } else {
      navigate('/');
    }

    monaco.editor.getModel(uri).dispose();
  }, [monaco, precedingURI]);

  const tabClass = `tab ${match?.params?.uri === uri.toString() ? 'bb-blue' : 'bb-light-grey'}`;
  return (
    <div className={tabClass}>
      <a className="tab__link" href="#" onClick={handleURIClick}>{uri.toString().split('/').pop()}</a>
      <a className="offwhite" href="#" onClick={handleGoXClick}><GoX/></a>
    </div>
  );
};

export const Tabs = () => {
  const loadedURIs = useLoadedURIs();

  return (
    <>
      {loadedURIs.map((uri, index) => {
        return <Tab
          key={`monaco-tab-${uri.toString()}`}
          uri={uri}
          precedingURI={loadedURIs[index - 1]}
        />;
      })}
    </>
  );
};

export default Tabs;
