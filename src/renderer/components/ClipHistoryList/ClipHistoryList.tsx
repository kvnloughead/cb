import { useContext, useState } from 'react';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import Pagination from '../Pagination/Pagination';
import './ClipHistoryList.css';

export default function ClipHistoryList() {
  const { clips, filterQuery } = useContext(ClipHistoryContext);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const filteredClips = clips.filter((clip) =>
    clip.content.includes(filterQuery),
  );
  const currentItems = filteredClips.slice(indexOfFirstItem, indexOfLastItem);

  const isMac = window.electron.platform === 'darwin';

  function addToClipboard(content: string) {
    window.electron.ipcRenderer.sendMessage('add-to-clipboard', content);
  }

  return (
    <ul className="clip-history-list">
      {currentItems.map((clip, i) => (
        <li key={clip.id}>
          <button
            type="button"
            className="select-clip-btn"
            aria-label={`select clip ${i + 1}`}
            onClick={() => addToClipboard(clip.content)}
          >
            <p className="truncate-line">{clip.content}</p>
            <p>
              {isMac ? '⌘' : '⌃'}&nbsp;{i + 1}
            </p>
          </button>
        </li>
      ))}
      <Pagination
        totalItems={filteredClips.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </ul>
  );
}
