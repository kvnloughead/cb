import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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
 * @template T - The schema definition object shape of the specific store contents.
 * @param client - The specific electron API client from window.electronAPI.
 * @param defaultValues - Fallback state used while loading from disk.
 * @param displayName - Name displayed in loading messages and React DevTools.
 * @returns - an array wrapping the context provider and a useStoreContext hook.
 * @example
 * const [myProvider, useMyContext] = createStoreContext<MyStoreType>(
 *   window.electron.myStoreClient,
 *   myDefaults,
 *   'My store',
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

    const update = useCallback(
      async <K extends keyof T>(key: K, value: T[K]) => {
        setData((prev) => ({ ...prev, [key]: value }));
        await getClient().set(key, value);
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
