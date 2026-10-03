import { useContext } from 'react';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import './ClipHistoryList.css';

export default function ClipHistoryList() {
  const { clips } = useContext(ClipHistoryContext);
  return (
    <ul className="clip-history-list">
      {clips.map((clip, i) => (
        <li key={clip.id}>
          <p className="truncate-line">{clip.content}</p>
          <button
            type="button"
            className="clip-number"
            aria-label={`select clip ${i + 1}`}
          >
            {i + 1}
          </button>
        </li>
      ))}
    </ul>
  );
}
