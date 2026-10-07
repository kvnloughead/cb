import { ChangeEvent, useState } from 'react';
import './Search.css';

type SearchPropTypes = {
  placeholder?: string;
  onChange: (query: string) => void;
};

export default function Search({ placeholder, onChange }: SearchPropTypes) {
  const [value, setValue] = useState<string>('');

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  }

  return (
    <div className="search-container">
      <label htmlFor="search-input" className="visually-hidden">
        Type to search
      </label>
      <input
        id="search-input"
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || 'Type to search'}
      />
    </div>
  );
}
