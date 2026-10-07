import { useContext, useState } from 'react';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import useShortcut from '../../hooks/useShortcut';
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
  const totalPages = Math.ceil(filteredClips.length / itemsPerPage);

  const isMac = window.electron.platform === 'darwin';

  function addToClipboard(content: string) {
    window.electron.ipcRenderer.sendMessage('add-to-clipboard', content);
  }

  function selectClipByNumber(num: number) {
    if (!Number.isInteger(num) || num < 0 || num > 8) return;

    const clip = currentItems[num];
    if (clip) addToClipboard(clip.content);
  }

  useShortcut({
    selectClip1: () => selectClipByNumber(0),
    selectClip2: () => selectClipByNumber(1),
    selectClip3: () => selectClipByNumber(2),
    selectClip4: () => selectClipByNumber(3),
    selectClip5: () => selectClipByNumber(4),
    selectClip6: () => selectClipByNumber(5),
    selectClip7: () => selectClipByNumber(6),
    selectClip8: () => selectClipByNumber(7),
    selectClip9: () => selectClipByNumber(8),
    previousPage: () => setCurrentPage((page) => Math.max(1, page - 1)),
    nextPage: () => setCurrentPage((page) => Math.min(page + 1, totalPages)),
  });

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
