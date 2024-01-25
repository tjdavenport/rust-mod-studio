import styled from 'styled-components';
import { GoPlusCircle } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';
import pluginBoilerplate from './pluginBoilerplate';
import { useCsharpProjectDirURI } from '../hooks/fs';
import { MouseEvent, useState, useCallback, useRef, useEffect, FormEvent } from 'react';

const PluginPane = styled.div`
  box-shadow: 0px 0px 4px 0px #000000;
  padding: 16px;
  border-radius: 4px;
  min-width: 280px;
  max-width: 50%;
  overflow-y: scroll;
`;
const PluginItem = styled.div`
  margin-bottom: 8px;
  border-radius: 4px;
  border: 1px #787c6a solid;
  padding: 8px 4px;
  background: rgb(26,26,22);
  background: linear-gradient(180deg, rgba(26,26,22,1) 0%, rgba(39,40,34,1) 100%);
`;
const ButtonWrapper = styled.button`
  padding: 0px;
  border: none;
  background-color: initial;
  cursor: pointer;
`;
const PluginInput = styled.input`
  width: 100%;
  background-color: initial;
  border: none;
  outline: none;
  box-sizing: border-box;
  height: 1rem;
`;
const KeyHelper = styled.div`
  color: #f8f8f2;
  border: 1px #f8f8f2 solid;
  border-radius: 4px;
  padding: .2rem;
  font-size: .55rem;
`;

const Plugin = ({ uri }: { uri: string }) => {
  const navigate = useNavigate();
  const pluginName = uri.split('/').pop();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(`/edit/${encodeURIComponent(uri)}`);
  };

  return (
    <PluginItem>
      <a href="#" className="offwhite" onClick={handleClick}>{pluginName}</a>
    </PluginItem>
  );
};

type PluginFormProps = {
  cancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
const PluginForm = ({ cancel, onSubmit }: PluginFormProps) => {
  const inputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    inputRef.current.focus();
    inputRef.current.setSelectionRange(0, 0);
  }, []);

  return (
    <PluginItem>
      <form style={{ display: 'flex' }} onBlur={cancel} onSubmit={onSubmit}>
        <div style={{ flexGrow: 1 }}>
          <PluginInput defaultValue=".cs" pattern="^[^\s]+$" name="filename" required ref={inputRef} className="offwhite" type="text"/>
        </div>
        <div>
          <KeyHelper>Enter</KeyHelper>
        </div>
      </form>
    </PluginItem>
  )
};

interface HomeProps {
  projectURIs: string[];
  read: () => void;
};
const Home = ({ projectURIs, read }: HomeProps) => {
  const [adding, setAdding] = useState<boolean>(false);
  const csharpProjectDirURI = useCsharpProjectDirURI();
  const navigate = useNavigate();
  const handleAddClick = useCallback(() => {
    setAdding(!adding);
  }, [setAdding, adding]);
  const notAdding = useCallback(() => {
    setAdding(false);
  }, [setAdding]);
  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('filename') as HTMLInputElement;
    const filename = input.value;
    const validation = validatePluginName(filename, projectURIs);

    if (validation) {
      alert(validation);
    } else {
      const fullURI = `${csharpProjectDirURI}/${filename}`;
      window.fs.writeTextByURI(
        fullURI,
        pluginBoilerplate(filename.replace('.cs', ''))
      ).then(() => {
        navigate(`/edit/${encodeURIComponent(fullURI)}`);
      }).catch(error => {
        console.error(error);
      });
    }
  }, [projectURIs, csharpProjectDirURI]);

  useEffect(() => {
    read();
  }, []);

  return (
    <div style={{ display: 'flex', padding: '12px' }}>
      <PluginPane className="bg-dark-grey">
        <div style={{ display: 'flex' }}>
          <div style={{ flexGrow: 1 }}>
            <h4 style={{ marginBottom: '12px' }}>My Plugins</h4>
          </div>
          <div>
            <ButtonWrapper onClick={handleAddClick} type="button">
              <GoPlusCircle className="offwhite" style={{ fontSize: '1.5rem' }}/>
            </ButtonWrapper>
          </div>
        </div>
        {adding && (
          <PluginForm cancel={notAdding} onSubmit={handleSubmit}/>
        )}
        {projectURIs.map(uri => {
          return (
            <Plugin key={`plugin-${uri}`} uri={uri}/>
          );
        })}
      </PluginPane>
    </div>
  );
};

const validatePluginName = (filename: string, existingURIs: string[]) => {
  if (!filename.endsWith('.cs')) {
    return 'Plugin must be a c# file';
  }
  if (existingURIs.some(uri => uri.includes(filename))) {
    return `Plugin ${filename} already exists`;
  }
  return '';
};

export default Home;
