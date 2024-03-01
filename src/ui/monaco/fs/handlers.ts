import { MonacoInstance } from '../';
import { matchPath } from 'react-router-dom';
import { uriFuzzyEqual } from '../';
import { MenuClickParams } from '../../../shared';


export const handleAppMenuSave = (monaco: MonacoInstance) => (params: MenuClickParams) => {
  if (params.pathname) {
    const match = matchPath('/edit/:uri', params.pathname);

    if (match?.params?.uri) {
      const model = monaco.editor.getModels().find((model) => {
        return uriFuzzyEqual(match.params.uri, model.uri.toString());
      });

      if (model) {
        window.fs.writeTextByURI(
          match.params.uri,
          model.getValue()
        );
      }
    }
  }
};
