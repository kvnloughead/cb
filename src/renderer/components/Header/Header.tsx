import { useContext } from 'react';
import Search from '../Search/Search';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import './Header.css';
import CommandPalette from '../CommandPalette/CommandPalette';

export default function Header() {
  const { setFilterQuery } = useContext(ClipHistoryContext);

  return (
    <header className="header">
      <CommandPalette />
      <div className="row">
        <h1 aria-label="cb">Clipboard History</h1>
        <Search onChange={setFilterQuery} />
      </div>
    </header>
  );
}
