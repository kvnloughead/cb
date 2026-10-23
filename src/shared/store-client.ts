// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Referenced by the JSDoc link below.
import type { createStoreContext } from '../renderer/contexts/StoreContext';

/**
 * Interface representing the client-side API to interact with the backend Electron store.
 * @template T - The schema definition object shape of the store contents.
 */
export interface RendererStoreClient<T extends Record<string, any>> {
  /**
   * Retrieves a single value from the store by its key.
   * @template K - A valid key from the store schema.
   * @param key - The key to look up.
   * @param defaultVal - Optional fallback value if the key does not exist.
   * @returns A promise resolving to the value or default value.
   */
  get<K extends keyof T>(key: K, defaultVal?: T[K]): Promise<T[K]>;

  /**
   * Overwrites or updates a specific key in the store.
   * @template K - A valid key from the store schema.
   * @param key - The key to update.
   * @param val - The new value matching the key's schema type.
   */
  set<K extends keyof T>(key: K, val: T[K]): Promise<void>;

  /**
   * Checks whether a specific key exists in the store.
   * @param key - The key to verify.
   * @returns A promise resolving to true if the key exists, false otherwise.
   */
  has(key: keyof T): Promise<boolean>;

  /**
   * Deletes a specific key and its value from the store.
   * @param key - The key to remove.
   */
  delete(key: keyof T): Promise<void>;

  /**
   * Retrieves the entire store object database.
   * @returns A promise resolving to a deep copy of the complete store.
   */
  getAll(): Promise<T>;
}

/**
 * Creates a type-safe client wrapper for invoking the main process store CRUD
 * handlers. For using this client in a React context, see
 * {@link createStoreContext}.
 *
 * @template T - The schema definition object shape of the store contents.
 * @param ipcRenderer - The Electron `ipcRenderer` instance or a custom context bridge proxy.
 * @param storeName - The prefix namespace matching the one passed to `setStoreHandlers` on the main process.
 * @returns An object containing CRUD methods mapping directly to backend IPC handlers.
 *
 * @example
 * ```typescript
 * // preload.ts
 * interface UserSettings { theme: 'light' | 'dark'; volume: number; }
 * const settingsStoreClient = createStoreClient<UserSettings>(window.ipcRenderer, 'settings');
 *
 * contextBridge.exposeInMainWorld('electron', {
 *   settingsStoreClient,
 * });
 * ```
 */
export function createStoreClient<T extends Record<string, any>>(
  ipcRenderer: Pick<Electron.IpcRenderer, 'invoke'>,
  storeName: string,
): RendererStoreClient<T> {
  return {
    get: (key, defaultVal) =>
      ipcRenderer.invoke(`${storeName}-store-get`, key, defaultVal),

    set: (key, val) => ipcRenderer.invoke(`${storeName}-store-set`, key, val),

    has: (key) => ipcRenderer.invoke(`${storeName}-store-has`, key),

    delete: (key) => ipcRenderer.invoke(`${storeName}-store-delete`, key),

    getAll: () => ipcRenderer.invoke(`${storeName}-store-get-all`),
  };
}
