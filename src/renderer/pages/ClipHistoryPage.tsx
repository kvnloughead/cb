import { useEffect, useState } from 'react';
import Header from '../components/Header/Header';
import ClipHistoryList from '../components/ClipHistoryList/ClipHistoryList';
import ClipHistoryContext from '../contexts/ClipHistoryContext';

export default function ClipHistoryPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [loadError, setLoadError] = useState<string>('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const initialClips =
          await window.electron.ipcRenderer.invoke('load-clip-history');
        setClips(initialClips);
      } catch (error) {
        setLoadError('Failed to load clipboard history');
        console.error('Failed to load clipboard history:', error);
      }
    };

    void loadHistory();
  }, []);

  return (
    <ClipHistoryContext.Provider value={{ clips, filterQuery, setFilterQuery }}>
      <Header />
      <main className="main">
        {loadError ? (
          <p role="alert" className="error-msg">
            {loadError}
          </p>
        ) : (
          <ClipHistoryList />
        )}
      </main>
    </ClipHistoryContext.Provider>
  );
}
