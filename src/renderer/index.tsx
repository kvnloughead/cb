import { createRoot } from 'react-dom/client';
import { ShortcutProvider } from './contexts/ShortcutContext';
import { ConfigProvider } from './contexts/StoreContext';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

// Log event handler errors, rejected promises, and IPC call errors.
window.addEventListener('error', (e) => console.error(e.error));
window.addEventListener('unhandledrejection', (e) => console.error(e.reason));

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <ConfigProvider>
      <ShortcutProvider>
        <App />
      </ShortcutProvider>
    </ConfigProvider>
  </ErrorBoundary>,
);
