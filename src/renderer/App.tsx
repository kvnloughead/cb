import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/index.css';
import { ShortcutProvider } from './contexts/ShortcutContext';
import { ConfigProvider } from './contexts/ConfigContext';
import ClipHistoryPage from './pages/ClipHistoryPage';
import MainLayout from './components/MainLayout/MainLayout';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

export default function App() {
  return (
    <div className="app">
      <ConfigProvider>
        <ShortcutProvider>
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
        </ShortcutProvider>
      </ConfigProvider>
    </div>
  );
}
