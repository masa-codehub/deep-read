import { renderHook, act, waitFor } from '@testing-library/react';
import { useDocumentLibrary } from './useDocumentLibrary';
import { getLibraryDocuments } from '../../infrastructure/services/api';

// APIをモック化
jest.mock('../../infrastructure/services/api');
const mockGetLibraryDocuments = getLibraryDocuments as jest.MockedFunction<typeof getLibraryDocuments>;

// テスト用のモックデータ
const mockDocuments = [
  {
    id: '1',
    title: 'Document 1',
    fileName: 'document_1.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Ready' as const,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    title: 'Document 2',
    fileName: 'document_2.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Processing' as const,
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
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
    
    // デフォルトのモック実装
    mockGetLibraryDocuments.mockResolvedValue(mockPaginatedResponse);
  });

  // 初期状態とデータロードをテスト
  test('初期状態でisLoadingがtrueになり、API成功後にdocumentsがセットされること', async () => {
    // モックの動作を確実にする
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockPaginatedResponse;
    });

    // カスタムフックをレンダリング
    const { result, rerender } = renderHook(() => useDocumentLibrary());

    // 初期状態ではisLoadingがtrueになっていることを確認
    expect(result.current.isLoading).toBe(true);
    expect(result.current.documents).toEqual([]);
    expect(result.current.error).toBeNull();

    // API呼び出しが完了するのを待つ - 直接Promiseを待機
    await act(async () => {
      // モックの解決を待つ
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    // 状態が更新されたことを確認
    expect(result.current.isLoading).toBe(false);
    
    // APIが呼ばれたことを確認
    expect(mockGetLibraryDocuments).toHaveBeenCalledTimes(1);
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(1, 10); // デフォルトパラメータ

    // データとメタデータが正しくセットされていることを確認
    expect(result.current.documents).toEqual(mockDocuments);
    expect(result.current.totalCount).toBe(mockDocuments.length);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  // API失敗時の処理をテスト
  test('API失敗時にエラーがセットされること', async () => {
    // このテスト用にAPIエラーをモック
    const errorMessage = 'APIエラーが発生しました';
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise((resolve, reject) => setTimeout(() => reject(new Error(errorMessage)), 10));
      return mockPaginatedResponse; // これは実行されない
    });

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // API呼び出しが完了するのを待つ
    await act(async () => {
      // エラーの処理を待つ
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // エラーメッセージが正しくセットされていることを確認
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.documents).toEqual([]);
  });

  // 表示モード変更をテスト
  test('setViewModeで表示モードが変更されること', async () => {
    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // 初期値はlist
    expect(result.current.viewMode).toBe('list');

    // グリッド表示に変更
    act(() => {
      result.current.setViewMode('grid');
    });

    // 表示モードがgridに変わったことを確認
    expect(result.current.viewMode).toBe('grid');
  });

  // 再試行機能をテスト
  test('retryFetchDocumentsで再度APIが呼ばれること', async () => {
    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // 初期ロードが完了するのを待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // この時点でのAPI呼び出し回数を記録
    const initialCallCount = mockGetLibraryDocuments.mock.calls.length;

    // 再試行を実行
    act(() => {
      result.current.retryFetchDocuments();
    });

    // isLoadingがtrueに戻ることを確認
    expect(result.current.isLoading).toBe(true);

    // 再度APIロードが完了するのを待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // APIが再度呼ばれたことを確認
    expect(mockGetLibraryDocuments).toHaveBeenCalledTimes(initialCallCount + 1);
  });

  // ページネーション機能をテスト
  test('changePageでページが変更されAPI呼び出しが発生すること', async () => {
    // ページごとに異なるモックデータを用意
    const page1Documents = [
      { 
        id: '1', 
        title: 'Document 1', 
        fileName: 'document_1.pdf', 
        updatedAt: new Date().toISOString(), 
        status: 'Ready' as const 
      },
      { 
        id: '2', 
        title: 'Document 2', 
        fileName: 'document_2.pdf', 
        updatedAt: new Date().toISOString(), 
        status: 'Processing' as const, 
        progress: 50 
      },
    ];
    
    const page2Documents = [
      { 
        id: '3', 
        title: 'Document 3', 
        fileName: 'document_3.pdf', 
        updatedAt: new Date().toISOString(), 
        status: 'Ready' as const 
      },
      { 
        id: '4', 
        title: 'Document 4', 
        fileName: 'document_4.pdf', 
        updatedAt: new Date().toISOString(), 
        status: 'Ready' as const 
      },
    ];

    // 複数ページのレスポンスをモック
    mockGetLibraryDocuments.mockImplementation(async (page) => {
      await new Promise(resolve => setTimeout(resolve, 10));
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

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary(1, 10));

    // 初期ロードが完了するのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });
    
    // 初期ページのデータを確認
    expect(result.current.isLoading).toBe(false);
    expect(result.current.documents).toEqual(page1Documents);
    expect(result.current.currentPage).toBe(1);

    // ページ2に変更
    act(() => {
      result.current.changePage(2);
    });
    
    // モック関数の解決を待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // ページ2のデータが表示されていることを確認
    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentPage).toBe(2);
    expect(result.current.documents).toEqual(page2Documents);
    
    // 最後の呼び出しでpage=2が指定されていることを確認
    expect(mockGetLibraryDocuments).toHaveBeenLastCalledWith(2, 10);
  });

  // ドキュメント更新機能をテスト
  test('updateDocumentPropertyで特定のドキュメントのプロパティが更新されること', async () => {
    // モック実装を明示的に設定
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockPaginatedResponse;
    });

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // 初期ロードが完了するのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 初期状態を確認
    expect(result.current.isLoading).toBe(false);
    expect(result.current.documents).toEqual(mockDocuments);

    // ドキュメント2のステータスと進捗を更新
    act(() => {
      result.current.updateDocumentProperty('2', {
        status: 'Ready',
        progress: 100
      });
    });

    // ドキュメント2が更新されていることを確認
    const updatedDoc = result.current.documents.find(doc => doc.id === '2');
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc?.status).toBe('Ready');
    expect(updatedDoc?.progress).toBe(100);

    // 他のドキュメントは変更されていないことを確認
    const doc1 = result.current.documents.find(doc => doc.id === '1');
    expect(doc1).toEqual(mockDocuments[0]);
  });

  // updateDocuments メソッドのテスト
  test('updateDocumentsで全ドキュメント配列が更新されること', async () => {
    // モック実装を明示的に設定
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return mockPaginatedResponse;
    });

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // 初期ロードが完了するのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 初期状態を確認
    expect(result.current.isLoading).toBe(false);

    // 新しいドキュメント配列
    const newDocuments = [
      {
        id: '5',
        title: '新しいドキュメント',
        fileName: 'new_document.pdf',
        updatedAt: new Date().toISOString(),
        status: 'Ready' as const,
      },
      {
        id: '6',
        title: 'もう一つの新しいドキュメント',
        fileName: 'another_document.pdf',
        updatedAt: new Date().toISOString(),
        status: 'Processing' as const,
        progress: 25,
      }
    ];

    // ドキュメント配列を更新
    act(() => {
      result.current.updateDocuments(newDocuments);
    });

    // ドキュメント配列が新しい値に更新されていることを確認
    expect(result.current.documents).toEqual(newDocuments);
    expect(result.current.documents).not.toEqual(mockDocuments);
    expect(result.current.documents.length).toBe(newDocuments.length);
  });

  // 初期パラメータが正しく設定されることをテスト
  test('カスタムパラメータが正しく初期化されること', async () => {
    // カスタムの初期ページとページサイズでレンダリング
    const initialPage = 2;
    const customPageSize = 5;
    
    // 特定のパラメータに対応したレスポンスをモック
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        ...mockPaginatedResponse,
        currentPage: initialPage,
        pageSize: customPageSize
      };
    });

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary(initialPage, customPageSize));

    // API呼び出しが完了するのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // ロード完了を確認
    expect(result.current.isLoading).toBe(false);

    // APIが正しいパラメータで呼ばれたことを確認
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(initialPage, customPageSize);
    
    // フックの状態が正しく設定されていることを確認
    expect(result.current.currentPage).toBe(initialPage);
    expect(result.current.pageSize).toBe(customPageSize);
  });

  // 無効なページ番号に対する境界値テスト
  test('無効なページ番号へのchangePage呼び出しが無視されること', async () => {
    // テスト用の総ページ数を設定
    const testTotalPages = 3;
    
    // モック実装でページ範囲を制限
    mockGetLibraryDocuments.mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return {
        ...mockPaginatedResponse,
        totalPages: testTotalPages,
        currentPage: 1
      };
    });

    // カスタムフックをレンダリング
    const { result } = renderHook(() => useDocumentLibrary());

    // 初期ロードが完了するのを待つ
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // 初期状態を確認
    expect(result.current.isLoading).toBe(false);
    expect(result.current.totalPages).toBe(testTotalPages);

    // API呼び出し回数をリセット
    mockGetLibraryDocuments.mockClear();

    // 存在しない小さい値（0）のページに変更を試みる
    act(() => {
      result.current.changePage(0);
    });

    // 存在しない大きい値（4）のページに変更を試みる
    act(() => {
      result.current.changePage(testTotalPages + 1);
    });

    // どちらの無効なページ変更も現在のページを変えず、API呼び出しが発生していないことを確認
    expect(mockGetLibraryDocuments).not.toHaveBeenCalled();
    expect(result.current.currentPage).toBe(1); // 初期値のまま

    // 有効なページへの変更は成功すること
    act(() => {
      result.current.changePage(2);
    });

    // 有効なページへの変更ではAPI呼び出しが発生することを確認
    expect(mockGetLibraryDocuments).toHaveBeenCalledWith(2, 10);
  });
});
