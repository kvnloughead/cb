import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

import './assets/css/index.css';
import { useConfig } from './contexts/ConfigContext';
import ClipHistoryPage from './pages/ClipHistoryPage';
import MainLayout from './components/MainLayout/MainLayout';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

export default function App() {
  const { config } = useConfig();
  const { theme } = config;

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark =
        theme === 'dark' || (theme === 'system' && prefersDark.matches);

      root.dataset['theme'] = isDark ? 'dark' : '';
    };

    applyTheme();

    if (theme !== 'system') return;

    prefersDark.addEventListener('change', applyTheme);
    return () => prefersDark.removeEventListener('change', applyTheme);
  }, [theme]);

  return (
    <div className="app">
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <MainLayout
                header={<Header />}
                main={<ClipHistoryPage />}
                footer={<Footer />}
              />
            }
          />
          <Route path="/store" element={<p>Store</p>} />
        </Routes>
      </Router>
    </div>
  );
}
