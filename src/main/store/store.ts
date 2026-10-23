import Store from 'electron-store';

/**
 * Sets basic CRUD IPC handlers for the given store on the Electron main process.
 *
 * Registers the following IPC channels:
 * - **Get one:** `${storeName}-store-get` (returns value for a specific key)
 * - **Get all:** `${storeName}-store-get-all` (returns the entire store object)
 * - **Set:** `${storeName}-store-set` (writes a value to a specific key)
 * - **Has:** `${storeName}-store-has` (checks if a key exists)
 * - **Delete:** `${storeName}-store-delete` (removes a specific key)
 *
 * @template T - The schema definition object shape of the store contents.
 * @param mainProcess - The Electron main process `ipcMain` instance to attach handlers to.
 * @param storeName - The prefix namespace for the IPC channels. Usually matches the name passed to `new Store()`.
 * @param store - The `electron-store` instance that operations will be executed against.
 */
export function setStoreHandlers<T extends Record<string, any>>(
  mainProcess: Electron.IpcMain,
  storeName: string,
  store: Store<T>,
) {
  mainProcess.handle(`${storeName}-store-get`, (_, key, defaultVal?) => {
    return store.get(key, defaultVal);
  });

  mainProcess.handle(`${storeName}-store-set`, (_, key, val) => {
    store.set(key, val);
  });

  mainProcess.handle(`${storeName}-store-has`, (_, key) => {
    return store.has(key);
  });

  mainProcess.handle(`${storeName}-store-delete`, (_, key) => {
    store.delete(key);
  });

  mainProcess.handle(`${storeName}-store-get-all`, () => store.store);
}
