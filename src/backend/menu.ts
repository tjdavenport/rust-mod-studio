import { URL } from 'url';
import { Menu } from 'electron';
import { MenuItemId, MenuClickParams } from '../shared';

export const emptyMenu = Menu.buildFromTemplate([]);

export const applicationMenu = Menu.buildFromTemplate([
  {
    role: 'appMenu'
  },
  {
    label: '&File',
    submenu: [
      {
        id: MenuItemId.Save,
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: (menuItem, browserWindow, event) => {
          const url = new URL(browserWindow.webContents.getURL());

          browserWindow.webContents.send(`app-menu-click-${menuItem.id}`, {
            pathname: url.hash.slice(1)
          } as MenuClickParams);
        }
      }
    ]
  },
  {
    label: '&Edit',
    submenu: [
      {
        label: 'Cut',
        role: 'cut' 
      },
      {
        label: 'Copy',
        role: 'copy' 
      },
      {
        label: 'Paste',
        role: 'paste' 
      },
      {
        label: 'Select All',
        role: 'selectAll'
      },
      {
        label: 'Undo',
        role: 'undo' 
      },
      {
        label: 'Redo',
        role: 'redo' 
      },
      {
        id: MenuItemId.Find,
        label: 'Find',
        accelerator: 'CmdOrCtrl+F',
        click: (menuItem, BrowserWindow) => {
          return BrowserWindow.webContents.send(`app-menu-click-${menuItem.id}`);
        }
      }
    ],
  },
  {
    label: '&View',
    submenu: [
      {
        id: MenuItemId.CmdPalette,
        label: 'Command Palette...',
        accelerator: 'CmdOrCtrl+P',
        click: (menuItem, BrowserWindow) => {
          return BrowserWindow.webContents.send(`app-menu-click-${menuItem.id}`);
        }
      },
      {
        label: 'Toggle Dev Tools',
        role: 'toggleDevTools'
      },
    ]
  }
]);
