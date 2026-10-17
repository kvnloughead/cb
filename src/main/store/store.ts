import Store from 'electron-store';

export function setStoreHandlers<T extends Record<string, any>>(
  mainProcess: Electron.IpcMain,
  storeName: string,
  store: Store<T>,
) {
  mainProcess.handle(`${storeName}-store-get`, (_, key) => {
    return store.get(key);
  });

  mainProcess.handle(`${storeName}-store-set`, (_, key, val) => {
    store.set(key, val);
  });

  mainProcess.handle(`${storeName}-store-update`, (_, key, val) => {
    store.set(key, val);
  });

  mainProcess.handle(`${storeName}-store-delete`, (_, key) => {
    store.delete(key);
  });

  mainProcess.handle(`${storeName}-store-get-all`, () => store.store);
}
