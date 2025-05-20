import { useEffect, useState, useRef } from 'react';
import { searchLibraryDocuments } from '../../infrastructure/services/api';
import type { Document } from '../../types/document';
import type { SearchLibraryRequest } from '../../types/search';

interface UseLibrarySearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: Document[];
  isLoading: boolean;
  error: string | null;
}

export function useLibrarySearch(): UseLibrarySearchReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 検索キーワードが空の場合は即リセット
    if (!searchTerm) {
      setSearchResults([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const controller = new AbortController();
    const signal = controller.signal;
    debounceRef.current = setTimeout(async () => {
      try {
        const params: SearchLibraryRequest = { keyword: searchTerm };
        const res = await searchLibraryDocuments(params, signal);
        if (!signal.aborted) {
          setSearchResults(res.documents || []);
          setIsLoading(false);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // キャンセル時は何もしない
          return;
        }
        if (e instanceof Error) {
          setError(e.message || '検索に失敗しました');
        } else {
          setError('検索に失敗しました');
        }
        setSearchResults([]);
        setIsLoading(false);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading,
    error,
  };
}
