import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/index.css';
import { ShortcutProvider } from './contexts/ShortcutContext';
import ClipHistoryPage from './pages/ClipHistoryPage';

export default function App() {
  return (
    <div className="app">
      <ShortcutProvider>
        <Router>
          <Routes>
            <Route path="/" element={<ClipHistoryPage />} />
          </Routes>
        </Router>
      </ShortcutProvider>
    </div>
  );
}
