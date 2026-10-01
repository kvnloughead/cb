/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build`, this file is compiled to
 * `./release/app/dist/main/main.js` using electron-vite.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Tray, Menu } from 'electron';
import log from 'electron-log';

import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import startAutoUpdates from './updates';
import {
  CI,
  DEBUG_PROD,
  HIDE_WINDOW,
  NODE_ENV,
  START_MINIMIZED,
  UPGRADE_EXTENSIONS,
} from './constants';
// import { startClipboardTracker } from './clipboard';

// Disable hardware acceleration on Linux CI runs
// Analogous to the --disable-gpu flag
if (CI === 'true' && process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (NODE_ENV === 'production') {
  process.setSourceMapsEnabled(true);
}

const isDebug = NODE_ENV === 'development' || DEBUG_PROD === 'true';

if (isDebug) {
  void import('electron-debug')
    .then(({ default: debug }) => debug())
    .catch(console.error);
}

const installExtensions = async () => {
  const { installExtension, REACT_DEVELOPER_TOOLS } =
    await import('electron-devtools-installer');
  return installExtension(REACT_DEVELOPER_TOOLS, {
    forceDownload: UPGRADE_EXTENSIONS === 'true',
  }).catch(console.log);
};

const getAssetPath = (...paths: string[]): string => {
  const resourcesPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(app.getAppPath(), 'assets');
  return path.join(resourcesPath, ...paths);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (START_MINIMIZED === 'true') {
      mainWindow.minimize();
    } else if (HIDE_WINDOW !== 'true') {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL(resolveHtmlPath('index.html'));
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function reportWindowError(error: unknown) {
  log.error('Failed to create the application window', error);
  mainWindow?.destroy();
  mainWindow = null;
}

function onActivate() {
  // Reopening a macOS window must not initialize another updater.
  if (mainWindow === null) {
    void createWindow().catch(reportWindowError);
  }
}

let tray: Tray | null = null;

function createTray() {
  const trayIconTemplate = getAssetPath(
    'icons',
    'macos',
    'clipboardTemplate.png',
  );
  tray = new Tray(trayIconTemplate);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: () => {
        if (mainWindow === null) {
          void createWindow().catch(reportWindowError);
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { label: 'Quit', click: () => app.quit() },
  ]);
  tray.setToolTip('CB');
  tray.setContextMenu(contextMenu);
}

app
  .whenReady()
  .then(async () => {
    await createWindow();

    createTray();
    startAutoUpdates();
    app.on('activate', onActivate);
  })
  .catch((error: unknown) => {
    reportWindowError(error);
    app.quit();
  });
