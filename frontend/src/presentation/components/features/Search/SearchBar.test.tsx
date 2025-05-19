import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders input and placeholder', () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="検索" />);
    expect(screen.getByPlaceholderText('検索')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalledWith('abc');
  });

  it('shows clear button and calls onClear', () => {
    const handleClear = vi.fn();
    render(<SearchBar value="test" onChange={() => {}} onClear={handleClear} />);
    const clearBtn = screen.getByRole('button', { name: /クリア/ });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalled();
  });

  it('shows loading indicator', () => {
    render(<SearchBar value="a" onChange={() => {}} isLoading />);
    expect(screen.getByText('検索中...')).toBeInTheDocument();
  });
});
