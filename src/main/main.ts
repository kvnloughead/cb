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
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Tray,
  Menu,
  clipboard,
} from 'electron';
import log from 'electron-log';

import MenuBuilder from './menu';
import { resolveHtmlPath, getAssetPath } from './path';
import { createTray } from './tray';
import startAutoUpdates from './updates';
import {
  CI,
  DEBUG_PROD,
  HIDE_WINDOW,
  MAX_CLIP_HISTORY,
  NODE_ENV,
  START_MINIMIZED,
  UPGRADE_EXTENSIONS,
} from './constants';
import { startClipboardTracker } from './clipboard';
import ClipHistoryDB from './database/clip-history';

// Disable hardware acceleration on Linux CI runs
// Analogous to the --disable-gpu flag
if (CI === 'true' && process.platform === 'linux') {
  app.disableHardwareAcceleration();
}

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('health-check', () => 'ok');

if (NODE_ENV === 'production') {
  process.setSourceMapsEnabled(true);
}

if (app.isPackaged) {
  app.setName('cb');
} else {
  app.setName('cb-dev');
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

const createWindow = async (options: { showOnReady?: boolean } = {}) => {
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

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    log.error(`Failed to load preload script at ${preloadPath}`, error);
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    if (START_MINIMIZED === 'true' && options.showOnReady !== true) {
      mainWindow.minimize();
    } else if (options.showOnReady ?? HIDE_WINDOW !== 'true') {
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

function reportWindowError(error: unknown) {
  log.error('Failed to create the application window', error);
  mainWindow?.destroy();
  mainWindow = null;
}

function onActivate() {
  // Reopening a macOS window must not initialize another updater.
  showWindowFromTray();
}

let tray: Tray | null = null;
let stopClipboardTracker: (() => void) | null = null;

app.on('before-quit', () => {
  tray?.destroy();
  stopClipboardTracker?.();
});

app.on('window-all-closed', () => {
  // The app remains running in the background for tray/clipboard monitoring.
  // The user must choose Quit from the tray or menu to fully exit.
});

function showWindowFromTray() {
  if (mainWindow === null) {
    void createWindow({ showOnReady: true }).catch(reportWindowError);
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
}

app
  .whenReady()
  .then(async () => {
    await createWindow();

    tray = createTray({
      Tray,
      Menu,
      getAssetPath,
      platform: process.platform,
      onShow: showWindowFromTray,
      onQuit: () => app.quit(),
    });

    const clipboardHistoryDbPath = path.join(
      app.getPath('userData'),
      'clip-history.db',
    );
    const clipHistoryDB = new ClipHistoryDB(
      clipboardHistoryDbPath,
      Number(MAX_CLIP_HISTORY),
    );

    stopClipboardTracker = await startClipboardTracker({
      readText: clipboard.readText,
      addToHistory: (content: string) => {
        const newClip = clipHistoryDB.addClip(content);
        mainWindow?.webContents.send('update-clip-history', newClip);
      },
    });

    ipcMain.handle('load-clip-history', async () => {
      try {
        return clipHistoryDB.getAllClips();
      } catch (error) {
        console.error('Database fetch failed:', error);
        throw error;
      }
    });

    ipcMain.on('add-to-clipboard', async (_, content) => {
      try {
        await clipboard.writeText(content);
      } catch (e) {
        console.error('Failed to add to clipboard', e);
      }
    });

    startAutoUpdates();
    app.on('activate', onActivate);
  })
  .catch((error: unknown) => {
    reportWindowError(error);
    app.quit();
  });
