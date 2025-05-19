import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useLibrarySearch } from './useLibrarySearch';
import * as api from '../../infrastructure/services/api';

vi.mock('../../infrastructure/services/api');
const mockSearchLibraryDocuments = api.searchLibraryDocuments as unknown as ReturnType<typeof vi.fn>;

describe('useLibrarySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態は空', () => {
    const { result } = renderHook(() => useLibrarySearch());
    expect(result.current.searchTerm).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('検索語入力でAPIが呼ばれ、結果がセットされる', async () => {
    mockSearchLibraryDocuments.mockResolvedValue({ documents: [{ id: '1', title: 'doc' }] });
    const { result } = renderHook(() => useLibrarySearch());
    act(() => { result.current.setSearchTerm('abc'); });
    await waitFor(() => {
      expect(mockSearchLibraryDocuments).toHaveBeenCalledWith({ keyword: 'abc' }, expect.anything());
      expect(result.current.searchResults).toEqual([{ id: '1', title: 'doc' }]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('APIエラー時はerrorがセットされる', async () => {
    mockSearchLibraryDocuments.mockRejectedValue(new Error('検索失敗'));
    const { result } = renderHook(() => useLibrarySearch());
    act(() => { result.current.setSearchTerm('error'); });
    await waitFor(() => {
      expect(result.current.error).toBe('検索失敗');
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('空文字列で検索結果がリセットされる', async () => {
    mockSearchLibraryDocuments.mockResolvedValue({ documents: [{ id: '1', title: 'doc' }] });
    const { result } = renderHook(() => useLibrarySearch());
    act(() => { result.current.setSearchTerm('abc'); });
    await waitFor(() => {
      expect(result.current.searchResults).toEqual([{ id: '1', title: 'doc' }]);
    });
    act(() => { result.current.setSearchTerm(''); });
    await waitFor(() => {
      expect(result.current.searchResults).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});
