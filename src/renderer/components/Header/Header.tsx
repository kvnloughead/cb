import { useContext } from 'react';
import Search from '../Search/Search';
import ClipHistoryContext from '../../contexts/ClipHistoryContext';
import './Header.css';

export default function Header() {
  const { setFilterQuery } = useContext(ClipHistoryContext);

  return (
    <header className="header">
      <h1 aria-label="cb">Clipboard History</h1>
      <Search onChange={setFilterQuery} />
    </header>
  );
}
