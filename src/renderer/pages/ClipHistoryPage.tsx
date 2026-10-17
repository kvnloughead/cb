import { useEffect, useState, useContext } from 'react';
import ClipHistoryList from '../components/ClipHistoryList/ClipHistoryList';
import ClipHistoryContext from '../contexts/ClipHistoryContext';

function isValidClip(clip: unknown): clip is Clip {
  if (typeof clip !== 'object' || clip === null) return false;
  const obj = clip as Record<string, unknown>;
  return typeof obj['id'] === 'number' && typeof obj['content'] === 'string';
}

export default function ClipHistoryPage() {
  const [loadError, setLoadError] = useState<string>('');
  const { setClips } = useContext(ClipHistoryContext);

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

  useEffect(() => {
    return window.electron.ipcRenderer.on(
      'update-clip-history',
      (newClip: unknown) => {
        if (!isValidClip(newClip)) return;
        setClips((currentClips) => [
          newClip,
          ...currentClips.filter((clip) => clip.content !== newClip.content),
        ]);
      },
    );
  }, []);

  return (
    <>
      {loadError ? (
        <p role="alert" className="error-msg">
          {loadError}
        </p>
      ) : (
        <ClipHistoryList />
      )}
    </>
  );
}
