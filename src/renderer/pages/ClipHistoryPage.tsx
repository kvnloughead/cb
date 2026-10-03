import { useEffect, useState } from 'react';
import Header from '../components/Header';
import ClipHistoryList from '../components/ClipHistoryList';

type Clip = {
  id: number;
  content: string;
};

export default function ClipHistoryPage() {
  const [history, setHistory] = useState<Clip[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const clips =
          await window.electron.ipcRenderer.invoke('load-clip-history');
        setHistory(clips as Clip[]);
      } catch (error) {
        console.error('Failed to load clip history:', error);
      }
    };

    void loadHistory();
  }, []);

  return (
    <>
      <Header />
      <main className="main">
        <ClipHistoryList history={history} />
      </main>
    </>
  );
}
