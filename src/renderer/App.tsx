import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/index.css';
import { ShortcutProvider } from './contexts/ShortcutContext';
import { ConfigProvider } from './contexts/ConfigContext';
import ClipHistoryPage from './pages/ClipHistoryPage';

export default function App() {
  return (
    <div className="app">
      <ConfigProvider>
        <ShortcutProvider>
          <Router>
            <Routes>
              <Route path="/" element={<ClipHistoryPage />} />
              <Route path="/store" element={<p>Store</p>} />
            </Routes>
          </Router>
        </ShortcutProvider>
      </ConfigProvider>
    </div>
  );
}
