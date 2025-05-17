import { useState, useEffect, useCallback } from 'react';
import { getLibraryDocuments, Document, PaginatedDocumentsResponse } from '../services/api';

/**
 * ドキュメントライブラリに関連する状態と処理をカプセル化するカスタムフック
 * 
 * @param initialPage 初期ページ番号
 * @param pageSize 1ページあたりのアイテム数
 * @returns ドキュメント一覧情報、読み込み状態、エラー情報、表示モード、および関連する関数
 */
export const useDocumentLibrary = (initialPage: number = 1, pageSize: number = 10) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  /**
   * ドキュメント一覧を取得する関数
   */
  const fetchDocs = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getLibraryDocuments(page, pageSize);
      setDocuments(response.documents);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  /**
   * ドキュメントを更新する関数
   */
  const updateDocuments = useCallback((updatedDocs: Document[]) => {
    setDocuments(updatedDocs);
  }, []);

  /**
   * ドキュメントの特定のプロパティを更新する関数
   */
  const updateDocumentProperty = useCallback((docId: string, updates: Partial<Document>) => {
    setDocuments(prevDocs => prevDocs.map(doc => {
      if (doc.id === docId) {
        return { ...doc, ...updates };
      }
      return doc;
    }));
  }, []);

  /**
   * ページを変更する関数
   */
  const changePage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  /**
   * 初期データ読み込み
   */
  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  /**
   * 再試行関数
   */
  const retryFetchDocuments = useCallback(() => {
    fetchDocs();
  }, [fetchDocs]);

  return {
    documents,
    isLoading,
    error,
    viewMode,
    setViewMode,
    retryFetchDocuments,
    totalCount,
    currentPage,
    totalPages,
    changePage,
    pageSize,
    refreshDocuments: fetchDocs,
    updateDocuments,
    updateDocumentProperty
  };
};

export default useDocumentLibrary;
