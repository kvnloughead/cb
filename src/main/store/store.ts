import Store from 'electron-store';
import type { Schema } from 'electron-store';

export function initStore<T extends Record<string, any>>(
  mainProcess: Electron.IpcMain,
  storeName: string,
  schema: Schema<T>,
): Store<T> {
  const store = new Store<T>({
    name: storeName,
    schema,
  });

  mainProcess.handle(`${storeName}-store-get`, (_, key) => {
    return store.get(key);
  });

  mainProcess.handle(`${storeName}-store-set`, (_, key, val) => {
    store.set(key, val);
  });

  mainProcess.handle(`${storeName}-store-get-all`, () => store.store);

  return store;
}
