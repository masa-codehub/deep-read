import { useState, useEffect, useCallback } from 'react';
import { getLibraryDocuments } from '../../infrastructure/services/api';
import type { Document } from '../../types/document';
import { useDocumentStatusPolling, PolledDocumentStatus } from './useDocumentStatusPolling';

export const useDocumentLibrary = (initialPage: number = 1, pageSize: number = 10) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [processingDocumentIds, setProcessingDocumentIds] = useState<string[]>([]);

  // ポーリング結果を受けてdocumentsを更新
  const handleStatusUpdate = useCallback((updatedStatuses: PolledDocumentStatus[]) => {
    setDocuments(currentDocs =>
      currentDocs.map(doc => {
        const update = updatedStatuses.find(s => s.id === doc.id);
        if (update) {
          return {
            ...doc,
            status: update.status,
            progress: update.progress,
            // error_message も必要ならここでセット
          };
        }
        return doc;
      })
    );
  }, []);

  useDocumentStatusPolling({
    documentIdsToPoll: processingDocumentIds,
    onStatusUpdate: handleStatusUpdate,
    pollingInterval: 4000,
    enabled: processingDocumentIds.length > 0,
  });

  const fetchDocs = useCallback(async (page: number = currentPage) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getLibraryDocuments(page, pageSize);
      setDocuments(response.documents);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setCurrentPage(response.currentPage);
      // ポーリング対象IDを更新
      const currentProcessingIds = response.documents
        .filter(doc => doc.status === 'PROCESSING')
        .map(doc => doc.id);
      setProcessingDocumentIds(currentProcessingIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      setProcessingDocumentIds([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize]);

  const updateDocuments = useCallback((updatedDocs: Document[]) => {
    setDocuments(updatedDocs);
    const newProcessingIds = updatedDocs
      .filter(doc => doc.status === 'PROCESSING')
      .map(doc => doc.id);
    setProcessingDocumentIds(newProcessingIds);
  }, []);

  const updateDocumentProperty = useCallback((docId: string, updates: Partial<Document>) => {
    setDocuments(prevDocs => {
      const newDocs = prevDocs.map(doc => (doc.id === docId ? { ...doc, ...updates } : doc));
      const newProcessingIds = newDocs
        .filter(doc => doc.status === 'PROCESSING')
        .map(doc => doc.id);
      setProcessingDocumentIds(newProcessingIds);
      return newDocs;
    });
  }, []);

  const changePage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    fetchDocs(currentPage);
  }, [currentPage, fetchDocs]);

  const retryFetchDocuments = useCallback(() => {
    fetchDocs(currentPage);
  }, [fetchDocs, currentPage]);

  const refreshDocuments = useCallback(() => {
    fetchDocs(currentPage);
  }, [fetchDocs, currentPage]);

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
    refreshDocuments,
    updateDocuments,
    updateDocumentProperty,
  };
};

export default useDocumentLibrary;
