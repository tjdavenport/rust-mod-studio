import { MonacoInstance } from '../';
import { matchPath } from 'react-router-dom';
import { MenuClickParams } from '../../../shared';

export const handleAppMenuSave = (monaco: MonacoInstance) => (params: MenuClickParams) => {
  if (params.pathname) {
    const match = matchPath('/edit/:uri', params.pathname);

    if (match?.params?.uri) {
      const model = monaco.editor.getModels().find((model) => {
        return model.uri.toString() === match.params.uri;
      });

      if (model) {
        window.fs.writeTextByURI(
          model.uri.toString(),
          model.getValue()
        );
      }
    }
  }
};
