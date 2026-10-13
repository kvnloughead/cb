import { useCallback, useContext, useRef, useState } from 'react';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import useShortcut from '../../hooks/useShortcut';
import Pagination from '../Pagination/Pagination';
import './ClipHistoryList.css';

export default function ClipHistoryList() {
  const { clips, filterQuery } = useContext(ClipHistoryContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const currentItemsRef = useRef<Clip[]>([]);

  const filteredClips = clips.filter((clip) =>
    clip.content.includes(filterQuery),
  );
  const setCurrentItems = useCallback((items: Clip[]) => {
    currentItemsRef.current = items;
  }, []);

  const isMac = window.electron.platform === 'darwin';

  function addToClipboard(content: string) {
    window.electron.ipcRenderer.sendMessage('add-to-clipboard', content);
  }

  function selectClipByNumber(num: number) {
    if (!Number.isInteger(num) || num < 0 || num > 8) return;

    const clip = currentItemsRef.current[num];
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
    nextPage: () => setCurrentPage((page) => page + 1),
  });

  return (
    <Pagination
      items={filteredClips}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
      onCurrentPageItemsChange={setCurrentItems}
      containerClassName="clip-history-list"
    >
      {(currentItems) =>
        currentItems.map((clip, i) => (
          <li key={clip.id}>
            <p className="truncate-line text">{clip.content}</p>

            {i + 1 < 10 && (
              <>
                <p className="text">
                  {isMac ? '⌘' : '⌃'}&nbsp;{i + 1}
                </p>
                <button
                  type="button"
                  className="select-clip-btn"
                  aria-label={`select clip ${i + 1}`}
                  onClick={() => addToClipboard(clip.content)}
                ></button>
              </>
            )}
          </li>
        ))
      }
    </Pagination>
  );
}
