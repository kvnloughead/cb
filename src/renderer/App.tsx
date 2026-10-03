import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/index.css';
import ClipHistoryPage from './pages/ClipHistoryPage';

export default function App() {
  return (
    <div className="app">
      <Router>
        <Routes>
          <Route path="/" element={<ClipHistoryPage />} />
        </Routes>
      </Router>
    </div>
  );
}
