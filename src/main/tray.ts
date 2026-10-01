import type {
  MenuItemConstructorOptions,
  Tray as ElectronTray,
} from 'electron';

export type CreateTrayOptions = {
  Tray: typeof import('electron').Tray;
  Menu: Pick<typeof import('electron').Menu, 'buildFromTemplate'>;
  getAssetPath: (...paths: string[]) => string;
  platform: string;
  onShow: () => void;
  onQuit: () => void;
};

export function createTray({
  Tray,
  Menu,
  getAssetPath,
  platform,
  onShow,
  onQuit,
}: CreateTrayOptions): ElectronTray {
  const iconPath =
    platform === 'darwin'
      ? getAssetPath('icons', 'macos', 'clipboardTemplate.png')
      : getAssetPath('icons', '16x16.png');
  const tray = new Tray(iconPath);
  const trayActions: MenuItemConstructorOptions[] = [
    { label: 'Show', click: onShow },
    { label: 'Quit', click: onQuit },
  ];
  const contextMenu = Menu.buildFromTemplate(trayActions);

  tray.setToolTip('CB');
  tray.setContextMenu(contextMenu);
  return tray;
}
