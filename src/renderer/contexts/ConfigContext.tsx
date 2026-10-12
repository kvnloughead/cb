import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ConfigOptions } from '../../shared/config';
import { configDefaults } from '../../shared/config';

interface ConfigContextType {
  config: ConfigOptions;
  updateConfig: (key: string, value: unknown) => Promise<void>;
}

/**
 * React Context object managing the global application configuration.
 *
 * Always check for a `null` value or prioritize the {@link useConfig} hook to
 * consume this safely.
 */
const ConfigContext = createContext<ConfigContextType | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
}

/**
 * Application configuration provider that bootstraps application-wide states.
 *
 * * **Electron Lifecycle:** Automatically pulls local settings from disk via the IPC bridge (`window.electron.configStore`) on mount.
 * * **Optimistic Updates:** Instantly updates internal React state before resolving file writes to ensure 60fps UI continuity.
 *
 * @component
 * @example
 * ```tsx
 * import { ConfigProvider } from './context/ConfigContext';
 *
 * function App() {
 *   return (
 *     <ConfigProvider>
 *       <MainApplicationDashboard />
 *     </ConfigProvider>
 *   );
 * }
 * ```
 */
export function ConfigProvider({ children }: ConfigProviderProps) {
  // Store all configuration values in a single state object
  const [config, setConfig] = useState<ConfigOptions>(configDefaults);
  const [loading, setLoading] = useState(true);

  // Fetch all configuration keys at startup
  useEffect(() => {
    async function loadConfig() {
      try {
        const loadedConfig = await window.electron.configStore.getAll();
        if (loadedConfig) setConfig(loadedConfig);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  /**
   * Dispatches updates locally to the application context and persists changes onto disk storage.
   *
   * @async
   * @param {string} key - The top-level settings key mapping directly to a field in `ConfigOptions`.
   * @param {unknown} value - The data structure or primitive matching the setting configuration.
   * @returns {Promise<void>} Resolves when the file write confirmation clears from the main Electron process thread.
   */
  const updateConfig = async (key: string, value: unknown) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    await window.electron.configStore.set(key, value);
  };

  if (loading) {
    return <div>Loading application configuration...</div>;
  }

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Custom hook to safely extract configuration context fields.
 *
 * @throws {Error} Thrown if invoked inside a component tree missing an ancestral `<ConfigProvider>`.
 * @returns {ConfigContextType} An object matching the state interface context payload layout.
 *
 * @example
 * ```tsx
 * const { config, updateConfig } = useConfig();
 *
 * const toggleTheme = () => {
 *   updateConfig('theme', config.theme === 'dark' ? 'light' : 'dark');
 * };
 * ```
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
