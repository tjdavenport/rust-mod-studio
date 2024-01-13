import { GoX } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import { useMonaco } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { useEffect, useCallback, useState, ReactNode, CSSProperties, FC, MouseEvent } from 'react';

interface LayoutProps {
  children: ReactNode;
  PrimaryIcon: FC<PrimaryIconProps>;
  style?: CSSProperties;
}

interface PrimaryIconProps {
  style?: CSSProperties;
  className: string;
};

const Tab = ({ uri }: { uri: monaco.Uri }) => {
  const navigate = useNavigate();
  const monaco = useMonaco();

  const handleURIClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (monaco) {
      navigate(`/edit/${encodeURIComponent(uri.toString())}`)
    }
  }, [monaco]);

  const handleGoXClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (monaco) {
      monaco.editor.getModel(uri).dispose();
    }
  }, [monaco]);

  return (
    <div>
      <a href="#" onClick={handleURIClick}>{uri.toString().split('/').pop()}</a>
      <a href="#" onClick={handleGoXClick}><GoX/></a>
    </div>
  );
};

export const Tabs = () => {
  const monaco = useMonaco();
  const [loadedURIs, setLoadedURIs] = useState<monaco.Uri[]>([]);

  useEffect(() => {
    if (monaco) {
      const syncModelsState = () => {
        setLoadedURIs(monaco.editor.getModels().map(model => {
          return model.uri;
        }));
      };

      const disposables = [
        monaco.editor.onDidCreateModel(syncModelsState),
        monaco.editor.onWillDisposeModel(model => {
          setLoadedURIs(loadedURIs.filter(uri => {
            return uri.toString() !== model.uri.toString();
          }));
        })
      ];

      syncModelsState();
      return () => {
        disposables.forEach(disposable => disposable.dispose());
      };
    }
  }, [monaco]);

  return (
    <>
      {loadedURIs.map(uri => {
        return <Tab uri={uri}/>;
      })}
    </>
  );
};

const Layout = ({ children, style, PrimaryIcon }: LayoutProps) => {
  return (
    <>
      <div className="bg-dark-grey bb-light-grey" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center' }}>
        <a href="#" className="h4">
          <PrimaryIcon className="light-grey" />
        </a>
        <Tabs/>
      </div>
      <div style={{ height: 'calc(100vh - 40px)', width: '100vw', ...style }}>{children}</div>
    </>
  );
};

export default Layout;
