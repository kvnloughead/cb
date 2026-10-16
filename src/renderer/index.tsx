import { createRoot } from 'react-dom/client';
import { ShortcutProvider } from './contexts/ShortcutContext';
import { ConfigProvider } from './contexts/ConfigContext';
import App from './App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <ConfigProvider>
    <ShortcutProvider>
      <App />
    </ShortcutProvider>
  </ConfigProvider>,
);
