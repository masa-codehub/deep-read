import React from 'react';
import './SearchBar.css';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  onClear?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, isLoading, onClear }) => {
  return (
    <div className="search-bar-container">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'キーワードで検索'}
        className="search-bar-input"
        aria-label="ライブラリ検索キーワード"
      />
      {value && onClear && (
        <button onClick={onClear} aria-label="検索キーワードをクリア" className="search-bar-clear">
          ×
        </button>
      )}
      {isLoading && <span className="search-bar-loading">検索中...</span>}
    </div>
  );
};
