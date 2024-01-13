import { URL } from 'url';
import { Menu, ipcMain } from 'electron';
import { MenuItemId, MenuClickParams } from '../constants';

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
    role: 'toggleDevTools'
  }
]);
