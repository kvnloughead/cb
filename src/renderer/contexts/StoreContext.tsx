import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { RendererStoreClient } from '../../shared/store-client';
import { configDefaults, type ConfigOptions } from '../../shared/config';

interface GenericContextType<T extends Record<string, any>> {
  data: T;
  update: <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
}

/**
 * A generalized factory that generates a type-safe React Context, Provider,
 * and Hook for any Electron-backed store.
 *
 * The Provider loads the store on mount and renders a loading message until
 * it resolves. The hook exposes `data` and `update(key, value)`. `update`
 * applies the change to state immediately, then persists it; if persisting
 * fails, it rolls the key back to its previous value and rejects.
 *
 * @template T - The schema definition object shape of the specific store contents.
 * @param client - The store client from window.electron, or a function that
 *   returns it. Pass a function that returns the client to defer the lookup until the
 *   client is used.
 * @param defaultValues - Initial state. Loaded values are merged over it, and
 *   it is used as-is if loading fails.
 * @param displayName - Used in the loading message, error logs, and the hook's
 *   "use{displayName} must be used within a {displayName}Provider" error.
 * @returns A `[Provider, useStore]` tuple.
 * @example
 * const [MyStoreProvider, useMyStore] = createStoreContext<MyStoreType>(
 *   () => window.electron.myStoreClient,
 *   myDefaults,
 *   'MyStore',
 * );
 */
export function createStoreContext<T extends Record<string, any>>(
  client: RendererStoreClient<T> | (() => RendererStoreClient<T>),
  defaultValues: T,
  displayName: string,
) {
  const getClient = typeof client === 'function' ? client : () => client;
  const StoreContext = createContext<GenericContextType<T> | null>(null);

  function StoreProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<T>(defaultValues);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      async function bootstrap() {
        try {
          const loadedData = await getClient().getAll();
          if (loadedData && Object.keys(loadedData).length > 0) {
            // Merge with defaults to guarantee any newly added keys exist
            setData((prev) => ({ ...prev, ...loadedData }));
          }
        } catch (error) {
          console.error(`Failed to load store [${displayName}]:`, error);
        } finally {
          setLoading(false);
        }
      }
      bootstrap();
    }, []);

    // Mirrors the latest rendered data so `update` can
    // capture the value to roll back to
    const currentDataRef = useRef(data);
    currentDataRef.current = data;

    const update = useCallback(
      async <K extends keyof T>(key: K, value: T[K]) => {
        const previous = currentDataRef.current[key];
        setData((prev) => ({ ...prev, [key]: value }));
        try {
          await getClient().set(key, value);
        } catch (error) {
          // Roll back unless a newer update to this key has already landed
          setData((prev) =>
            prev[key] === value ? { ...prev, [key]: previous } : prev,
          );
          throw error;
        }
      },
      [],
    );

    if (loading) {
      return <div>Loading {displayName}...</div>;
    }

    return (
      <StoreContext.Provider value={{ data, update }}>
        {children}
      </StoreContext.Provider>
    );
  }

  function useStoreHook() {
    const context = useContext(StoreContext);
    if (!context) {
      throw new Error(
        `use${displayName} must be used within a ${displayName}Provider`,
      );
    }
    return context;
  }

  return [StoreProvider, useStoreHook] as const;
}

const [ConfigProvider, useConfig] = createStoreContext<ConfigOptions>(
  () => window.electron.configStoreClient,
  configDefaults,
  'Config',
);

export { ConfigProvider, useConfig };
