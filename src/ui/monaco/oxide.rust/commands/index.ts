import { MonacoInstance } from '../../';
import { default as addHook } from './addHook';

export const registerAll = (monaco: MonacoInstance) => {
  monaco.editor.addCommand(addHook(monaco));
};
