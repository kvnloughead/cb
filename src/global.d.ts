import type { ElectronHandler } from './preload/preload';

declare global {
  interface Window {
    electronAPI: ElectronHandler;
  }
}
