import { useContext } from 'react';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import './ClipHistoryList.css';

export default function ClipHistoryList() {
  const { clips, filterQuery } = useContext(ClipHistoryContext);

  function addToClipboard(content: string) {
    window.electron.ipcRenderer.sendMessage('add-to-clipboard', content);
  }

  return (
    <ul className="clip-history-list">
      {clips
        .filter((clip) => clip.content.includes(filterQuery))
        .map((clip, i) => (
          <li key={clip.id}>
            <button
              type="button"
              className="select-clip-btn"
              aria-label={`select clip ${i + 1}`}
              onClick={() => addToClipboard(clip.content)}
            >
              <p className="truncate-line">{clip.content}</p>
              {i + 1}
            </button>
          </li>
        ))}
    </ul>
  );
}
