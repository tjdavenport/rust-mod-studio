import { useEffect, useState, useCallback } from 'react';

export const useCsharpProjectDir = () => {
  const [textFileURIs, setTextFileURIs] = useState<string[]>([]);
  const add = useCallback((uri: string) => {
    setTextFileURIs([...textFileURIs, uri]);
  }, [textFileURIs]);

  useEffect(() => {
    window.fs.readCsharpProjectDir()
      .then((readURIs: string[]) => {
        setTextFileURIs(readURIs);
      }).catch(error => {
        console.error(error);
        // @TODO - handle situation where reading a project file fails
      })
  }, []);

  return {
    textFileURIs,
    add
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
