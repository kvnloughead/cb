// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

import { createStoreClient } from '../shared/store-client';
import type { ConfigOptions } from '../shared/config';

export type Channels =
  | 'health-check'
  | 'load-clip-history'
  | 'filter-clip-history'
  | 'add-to-clipboard'
  | 'update-clip-history'
  | 'config-store-get'
  | 'config-store-set'
  | 'change-theme'
  | 'open-config-file';

const configStoreClient = createStoreClient<ConfigOptions>(
  ipcRenderer,
  'config',
);

const electronHandler = {
  platform: process.platform,
  openConfigFile: () => ipcRenderer.invoke('open-config-file'),
  configStoreClient: configStoreClient,
  ipcRenderer: {
    invoke(channel: Channels, ...args: unknown[]) {
      return ipcRenderer.invoke(channel, ...args);
    },
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
