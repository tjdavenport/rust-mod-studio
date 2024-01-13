import fsx from 'fs-extra';
import * as path from './path';
import { join } from 'node:path';
import { ipcMain } from 'electron';
import { fileURLToPath, pathToFileURL } from 'url';

export const writeTextByURI = (uri: string, contents: string) => {
  const filePath = fileURLToPath(uri);
  return fsx.outputFile(filePath, contents);
};

export const readTextByURI = async (uri: string) => {
  const filePath = fileURLToPath(uri);
  const buffer = await fsx.readFile(filePath);
  return buffer.toString();
};

export const readCsharpProjectDir = async (app: Electron.App) => {
  const filenames = await fsx.readdir(path.csharpProjectDir(app));
  const cSharpFilenames = filenames.filter((filename) => {
    return filename.toLowerCase().endsWith('.cs');
  });
  const fileURIs = cSharpFilenames.map(filename => {
    return pathToFileURL(join(path.csharpProjectDir(app), filename)).href;
  });
  return fileURIs;
};

export const bindIpcMain = (app: Electron.App) => {
  ipcMain.handle('fs-read-csharp-project-dir', async () => {
    return readCsharpProjectDir(app);
  });
  ipcMain.handle('fs-read-text-by-uri', async (event, uri: string) => {
    return readTextByURI(uri);
  });
  ipcMain.on('fs-write-text-by-uri', async (event, uri: string, contents: string) => {
    return writeTextByURI(uri, contents);
  });
};
