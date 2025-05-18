import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useDocumentLibrary } from './useDocumentLibrary';
import { getLibraryDocuments } from '../../infrastructure/services/api';
import type { Document } from '../../types/document';
import * as pollingModule from './useDocumentStatusPolling';

// APIをモック化
vi.mock('../../infrastructure/services/api');
// getLibraryDocumentsの型をvi.fnの戻り値型でキャスト
const mockGetLibraryDocuments = getLibraryDocuments as unknown as ReturnType<typeof vi.fn>;

// テスト用のモックデータ
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Document 1',
    fileName: 'document_1.pdf',
    updatedAt: new Date().toISOString(),
    status: 'READY' as const,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    title: 'Document 2',
    fileName: 'document_2.pdf',
    updatedAt: new Date().toISOString(),
    status: 'PROCESSING' as const,
    progress: 50,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
];

const mockPaginatedResponse = {
  documents: mockDocuments,
  totalCount: mockDocuments.length,
  currentPage: 1,
  pageSize: 10,
  totalPages: 1
};

describe('useDocumentLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック実装（即時解決）
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return mockPaginatedResponse;
    });
    // useDocumentStatusPollingをデフォルトで何もしないモックに
    vi.spyOn(pollingModule, 'useDocumentStatusPolling').mockImplementation(() => {});
  });

  test('初期状態でisLoadingがtrueになり、API成功後にdocumentsがセットされること', async () => {
    // 即時解決のモック
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return mockPaginatedResponse;
    });
    const { result } = renderHook(() => useDocumentLibrary());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.documents).toEqual([]);
    expect(result.current.error).toBeNull();
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockGetLibraryDocuments).toHaveBeenCalledTimes(1);
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(1, 10);
    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.totalCount).toBe(mockDocuments.length);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  test('API失敗時にエラーがセットされること', async () => {
    const errorMessage = 'APIエラーが発生しました';
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      throw new Error(errorMessage);
    });
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.documents).toEqual([]);
  });

  test('setViewModeで表示モードが変更されること', async () => {
    const { result } = renderHook(() => useDocumentLibrary());
    expect(result.current.viewMode).toBe('list');
    await act(async () => {
      result.current.setViewMode('grid');
    });
    expect(result.current.viewMode).toBe('grid');
  });

  test('retryFetchDocumentsで再度APIが呼ばれること', async () => {
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    const initialCallCount = mockGetLibraryDocuments.mock.calls.length;
    await act(async () => {
      result.current.retryFetchDocuments();
    });
    // isLoadingのtrue状態は即時解決のため観測しない
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockGetLibraryDocuments).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  test('changePageでページが変更されAPI呼び出しが発生すること', async () => {
    const page1Documents = [
      { id: '1', title: 'Document 1', fileName: 'document_1.pdf', updatedAt: new Date().toISOString(), status: 'READY' as const },
      { id: '2', title: 'Document 2', fileName: 'document_2.pdf', updatedAt: new Date().toISOString(), status: 'PROCESSING' as const, progress: 50 },
    ];
    const page2Documents = [
      { id: '3', title: 'Document 3', fileName: 'document_3.pdf', updatedAt: new Date().toISOString(), status: 'READY' as const },
      { id: '4', title: 'Document 4', fileName: 'document_4.pdf', updatedAt: new Date().toISOString(), status: 'READY' as const },
    ];
    mockGetLibraryDocuments.mockImplementation(async (page) => {
      await Promise.resolve();
      if (page === 2) {
        return {
          documents: page2Documents,
          totalCount: 4,
          currentPage: 2,
          pageSize: 10,
          totalPages: 2
        };
      } else {
        return {
          documents: page1Documents,
          totalCount: 4,
          currentPage: 1,
          pageSize: 10,
          totalPages: 2
        };
      }
    });
    const { result } = renderHook(() => useDocumentLibrary(1, 10));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.documents).toEqual(page1Documents);
    expect(result.current.currentPage).toBe(1);
    await act(async () => {
      result.current.changePage(2);
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.currentPage).toBe(2);
    expect(result.current.documents).toEqual(page2Documents);
    expect(mockGetLibraryDocuments).toHaveBeenLastCalledWith(2, 10);
  });

  test('updateDocumentPropertyで特定のドキュメントのプロパティが更新されること', async () => {
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return mockPaginatedResponse;
    });
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    await act(async () => {
      result.current.updateDocumentProperty('2', {
        status: 'READY',
        progress: 100
      });
    });
    const updatedDoc = result.current.documents.find(doc => doc.id === '2');
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc?.status).toBe('READY');
    expect(updatedDoc?.progress).toBe(100);
    const doc1 = result.current.documents.find(doc => doc.id === '1');
    expect(doc1).toEqual(mockDocuments[0]);
  });

  test('updateDocumentsで全ドキュメント配列が更新されること', async () => {
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return mockPaginatedResponse;
    });
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    const newDocuments = [
      {
        id: '5',
        title: '新しいドキュメント',
        fileName: 'new_document.pdf',
        updatedAt: new Date().toISOString(),
        status: 'READY' as const,
      },
      {
        id: '6',
        title: 'もう一つの新しいドキュメント',
        fileName: 'another_document.pdf',
        updatedAt: new Date().toISOString(),
        status: 'PROCESSING' as const,
        progress: 25,
      }
    ];
    await act(async () => {
      result.current.updateDocuments(newDocuments);
    });
    expect(result.current.documents).toEqual(newDocuments);
    expect(result.current.documents).not.toEqual(mockDocuments);
    expect(result.current.documents.length).toBe(newDocuments.length);
  });

  test('カスタムパラメータが正しく初期化されること', async () => {
    const initialPage = 2;
    const customPageSize = 5;
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return {
        ...mockPaginatedResponse,
        currentPage: initialPage,
        pageSize: customPageSize
      };
    });
    const { result } = renderHook(() => useDocumentLibrary(initialPage, customPageSize));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(initialPage, customPageSize);
    expect(result.current.currentPage).toBe(initialPage);
    expect(result.current.pageSize).toBe(customPageSize);
  });

  test('無効なページ番号へのchangePage呼び出しが無視されること', async () => {
    const testTotalPages = 3;
    mockGetLibraryDocuments.mockImplementation(async () => {
      await Promise.resolve();
      return {
        ...mockPaginatedResponse,
        totalPages: testTotalPages,
        currentPage: 1
      };
    });
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    mockGetLibraryDocuments.mockClear();
    await act(async () => {
      result.current.changePage(0);
      result.current.changePage(testTotalPages + 1);
    });
    expect(mockGetLibraryDocuments).not.toHaveBeenCalled();
    expect(result.current.currentPage).toBe(1);
    await act(async () => {
      result.current.changePage(2);
    });
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(2, 10);
  });

  test('ポーリングでドキュメントのstatus/progressが更新されること', async () => {
    // useDocumentStatusPollingのonStatusUpdateを即時呼び出すモック
    vi.spyOn(pollingModule, 'useDocumentStatusPolling').mockImplementation(({ onStatusUpdate }) => {
      setTimeout(() => {
        onStatusUpdate([
          { id: '2', status: 'READY', progress: 100, error_message: undefined },
        ]);
      }, 0);
    });
    const { result } = renderHook(() => useDocumentLibrary());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // ポーリングでstatus/progressが更新されることを検証
    await waitFor(() => {
      const updatedDoc = result.current.documents.find(doc => doc.id === '2');
      expect(updatedDoc?.status).toBe('READY');
      expect(updatedDoc?.progress).toBe(100);
    });
  });
});
