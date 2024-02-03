export enum MenuItemId {
  Save = '1'
};

export type MenuClickParams = {
  pathname?: string;
};

export type DependencyState = {
  name: string;
  installed: boolean;
  running: boolean;
}[];
