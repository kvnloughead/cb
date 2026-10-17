import Store from 'electron-store';
import type { Schema } from 'electron-store';

interface InitStoreParams<T> {
  storeName: string;
  mainProcess: Electron.IpcMain;
  schema: Schema<T>;
}

export function initStore<T extends Record<string, any>>({
  storeName,
  mainProcess,
  schema,
}: InitStoreParams<T>): Store<T> {
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
