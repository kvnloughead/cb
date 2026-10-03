import Search from '../Search/Search';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <h1 aria-label="cb">Clipboard History</h1>
      <Search
        onChange={(e) => {
          console.log(e);
        }}
      />
    </header>
  );
}
