import { KeyboardEvent, ChangeEvent, useState, useRef, useEffect } from 'react';
import useShortcut from '../../hooks/useShortcut';
import './Search.css';

type SearchPropTypes = {
  placeholder?: string;
  onChange: (query: string) => void;
};

export default function Search({ placeholder, onChange }: SearchPropTypes) {
  const [value, setValue] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  function unfocus(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape' && e.target instanceof HTMLElement) {
      searchInputRef.current?.blur();
    }
  }

  useEffect(() => {
    searchInputRef?.current?.focus();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  }

  useShortcut({
    focusSearch: () => searchInputRef.current?.focus(),
  });

  return (
    <form className="search-container" role="search">
      <label htmlFor="search-input" className="visually-hidden">
        Type to search
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={unfocus}
        placeholder={placeholder || 'Type to search'}
        ref={searchInputRef}
      />
    </form>
  );
}
