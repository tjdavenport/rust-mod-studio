import fsx from 'fs-extra';
import * as path from './path';
import * as util from 'node:util';
import { ipcMain } from 'electron';
import * as childProcess from 'child_process';

const exec = util.promisify(childProcess.exec);

export const hasDotnet = async () => {
  try {
    const { stderr } = await exec('dotnet --version');

    if (stderr) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const hasSteamCmd = async (app: Electron.App) => {
  try {
    return await fsx.pathExists(path.steamCmd(app));
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const hasOmniSharp = async (app: Electron.App) => {
  try {
    return await fsx.pathExists(path.omniSharp(app));
  } catch (error) {
    console.error(error);
    return false;
  }
}

export const bindIpcMain = (app: Electron.App) => {
  ipcMain.handle('has-dotnet', async () => {
    return await hasDotnet();
  });
  ipcMain.handle('has-steamcmd', async () => {
    return await hasSteamCmd(app);
  });
  ipcMain.handle('has-omnisharp', async () => {
    return await hasOmniSharp(app);
  });
};
