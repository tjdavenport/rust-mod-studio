import { useEffect, useState, useCallback } from 'react';

export const useCsharpProjectDirURI = () => {
  const [uri, setURI] = useState<string>('');

  useEffect(() => {
    window.fs.getCsharpProjectDirURI()
    .then(uri => {
      setURI(uri);
    }).catch(error => {
      console.error(error);
    });
  }, []);

  return uri;
};

export const useCsharpProjectDir = () => {
  const [textFileURIs, setTextFileURIs] = useState<string[]>([]);
  const read = useCallback(() => {
    window.fs.readCsharpProjectDir()
      .then((readURIs: string[]) => {
        setTextFileURIs(readURIs);
      }).catch(error => {
        console.error(error);
        // @TODO - handle situation where reading a project file fails
      })
  }, []);

  useEffect(() => {
    read();
  }, []);

  return {
    textFileURIs,
    read,
  };
};

export const useCsharpProjectFile = (uri: string) => {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    window.fs.readTextByURI(uri)
      .then((content) => {
        setContent(content);
      }).catch(error => {
        console.error(error);
        /**
         * @TODO handle error
         */
      });
  }, []);

  return content;
};
