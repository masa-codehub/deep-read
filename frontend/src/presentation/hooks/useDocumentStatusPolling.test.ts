import { renderHook, act, waitFor } from '@testing-library/react';
import useDocumentStatusPolling from './useDocumentStatusPolling';
import { getDocumentStatus, Document } from '../../infrastructure/services/api';

// テストのタイムアウト設定を増やす (ファイル全体に適用)
jest.setTimeout(30000);

// APIをモック化
jest.mock('../../infrastructure/services/api');
const mockGetDocumentStatus = getDocumentStatus as jest.MockedFunction<typeof getDocumentStatus>;

// テスト用のモックドキュメントを作成
const createMockDocuments = (): Document[] => [
  {
    id: 'doc-ready',
    title: 'Ready Document',
    fileName: 'ready.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Ready',
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: 'doc-processing-1',
    title: 'Processing Document 1',
    fileName: 'processing1.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Processing',
    progress: 50,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: 'doc-processing-2',
    title: 'Processing Document 2',
    fileName: 'processing2.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Processing',
    progress: 25,
    thumbnailUrl: 'https://via.placeholder.com/150',
  }
];

describe('useDocumentStatusPolling', () => {
  beforeEach(() => {
    // フェイクタイマーを使用（legacy方式を使用してより安定した挙動を得る）
    jest.useFakeTimers({ legacyFakeTimers: true });
    
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    // テストの後にリアルタイマーに戻す
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // 基本的なポーリングテスト
  test('処理中のドキュメントがあるとポーリングが開始されること', async () => {
    // 最初のポーリングでは進捗更新だけを模擬
    mockGetDocumentStatus
      // doc-processing-1のレスポンス（進捗のみ更新）
      .mockResolvedValueOnce({
        id: 'doc-processing-1',
        status: 'Processing',
        progress: 75 // 進捗が更新される
      })
      // doc-processing-2のレスポンス（進捗のみ更新）
      .mockResolvedValueOnce({
        id: 'doc-processing-2',
        status: 'Processing',
        progress: 50 // 進捗が更新される
      });

    // 初期ドキュメント配列
    const initialDocs = createMockDocuments();
    
    // フックをレンダリング（テスト用に適切なポーリング間隔を指定）
    const { result } = renderHook(() => 
      useDocumentStatusPolling(initialDocs, 100) // 100ミリ秒ポーリング（テスト高速化用）
    );
    
    // 初期値のドキュメント配列が返されることを確認
    expect(result.current.documents).toEqual(initialDocs);
    
    // 非同期処理の解決を待つ
    // Jest の "jest-mock-promise" パターンを使用
    await act(async () => {
      // すべてのPromiseを解決
      await Promise.resolve();
    });
    
    // フックが正しく呼ばれたことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(2);
    
    // 両方の処理中ドキュメントにポーリングが行われたことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledWith('doc-processing-1');
    expect(mockGetDocumentStatus).toHaveBeenCalledWith('doc-processing-2');
    
    // ドキュメントの状態更新を確認（タイムアウトを長めに設定）
    await waitFor(() => {
      expect(result.current.documents.find(d => d.id === 'doc-processing-1')?.progress).toBe(75);
      expect(result.current.documents.find(d => d.id === 'doc-processing-2')?.progress).toBe(50);
    }, { timeout: 3000 });
    
    // 次のポーリングサイクルで状態の変化を模擬
    mockGetDocumentStatus
      // doc-processing-1のレスポンス（完了に変更）
      .mockResolvedValueOnce({
        id: 'doc-processing-1',
        status: 'Ready',
        progress: 100
      })
      // doc-processing-2のレスポンス（進捗更新）
      .mockResolvedValueOnce({
        id: 'doc-processing-2',
        status: 'Processing',
        progress: 75
      });
      
    // 次のポーリングサイクルを進める（より安定した方法）
    await act(async () => {
      // タイマーを進める
      jest.runOnlyPendingTimers(); 
      
      // すべてのマイクロタスク（Promises）が実行されるのを待つ
      await Promise.resolve();
      // もう一度すべてのマイクロタスクが実行されるのを待つ
      await Promise.resolve();
    });
    
    // 次のポーリングが完了しているか確認
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(4);
    
    // ドキュメントの状態と進捗が正しく更新されていることを確認（タイムアウト増加）
    await waitFor(() => {
      const updatedDoc1 = result.current.documents.find(d => d.id === 'doc-processing-1');
      expect(updatedDoc1?.status).toBe('Ready');
      expect(updatedDoc1?.progress).toBe(100);
      
      const updatedDoc2 = result.current.documents.find(d => d.id === 'doc-processing-2');
      expect(updatedDoc2?.status).toBe('Processing');
      expect(updatedDoc2?.progress).toBe(75);
    }, { timeout: 3000 });
  });

  // すべてのドキュメントが処理完了した場合のテスト
  test('すべてのドキュメントが処理完了するとポーリングが停止すること', async () => {
    // ポーリングで全てのドキュメントが完了状態になることを模擬
    mockGetDocumentStatus
      // doc-processing-1のレスポンス（完了に変更）
      .mockResolvedValueOnce({
        id: 'doc-processing-1',
        status: 'Ready',
        progress: 100
      })
      // doc-processing-2のレスポンス（完了に変更）
      .mockResolvedValueOnce({
        id: 'doc-processing-2',
        status: 'Ready',
        progress: 100
      });

    // 初期ドキュメント配列
    const initialDocs = createMockDocuments();
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useDocumentStatusPolling(initialDocs, 100) // テスト用に短いインターバル
    );
    
    // 最初のポーリングの完了を待つ（より安定した方法）
    await act(async () => {
      // すべてのPromiseを解決
      await Promise.resolve();
    });
    
    // APIの呼び出し回数を確認と記録
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(2);
    const callCountAfterFirstPolling = mockGetDocumentStatus.mock.calls.length;
    
    // すべてのドキュメントがReadyに更新されたことを確認（タイムアウト増加）
    await waitFor(() => {
      const readyDocs = result.current.documents.filter(d => d.status === 'Ready');
      expect(readyDocs.length).toBe(initialDocs.length); // すべてのドキュメントがReady
    }, { timeout: 3000 });
    
    // 次のポーリングサイクルをシミュレート
    await act(async () => {
      // タイマーを実行
      jest.runOnlyPendingTimers();
      // すべてのマイクロタスクを完了
      await Promise.resolve();
    });
    
    // もう一度ポーリングサイクルをシミュレート
    await act(async () => {
      // タイマーを実行
      jest.runOnlyPendingTimers();
      // すべてのマイクロタスクを完了
      await Promise.resolve();
    });
    
    // 少し待機してタイマーが設定される機会があるかどうか確認
    await act(async () => {
      // すべてのタイマーを進める
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    // APIがそれ以上呼ばれていないことを確認（すべてのドキュメントが完了してポーリングが停止している）
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(callCountAfterFirstPolling);
  });

  // エラー処理のテスト
  test('APIエラーが発生してもポーリングは継続すること', async () => {
    // 1つのドキュメントでエラー、もう1つは正常に処理するシナリオ
    mockGetDocumentStatus
      // doc-processing-1のAPI呼び出しでエラー
      .mockRejectedValueOnce(new Error('ネットワークエラー'))
      // doc-processing-2は正常に処理
      .mockResolvedValueOnce({
        id: 'doc-processing-2',
        status: 'Processing',
        progress: 50
      });

    // スパイでconsole.errorを監視
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 初期ドキュメント配列
    const initialDocs = createMockDocuments();
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useDocumentStatusPolling(initialDocs, 100) // テスト用に短いインターバル
    );
    
    // 非同期処理の完了を待つ
    await act(async () => {
      // すべてのPromiseを解決（エラーも含む）
      try {
        await Promise.resolve();
      } catch (e) {
        // エラーは無視（mockRejectedValueOnceによるエラーが発生しても続行）
      }
    });
    
    // APIが呼ばれたことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(2);
    
    // エラーがログに記録されたことを確認
    expect(consoleErrorSpy).toHaveBeenCalled();
    
    // エラーが発生したにもかかわらず、正常に処理されたドキュメントは更新されていることを確認
    await waitFor(() => {
      const doc2 = result.current.documents.find(d => d.id === 'doc-processing-2');
      expect(doc2?.progress).toBe(50);
    }, { timeout: 3000 });
    
    // 次のポーリングサイクルのためにAPIモックを設定
    mockGetDocumentStatus
      .mockResolvedValueOnce({
        id: 'doc-processing-1',
        status: 'Processing',
        progress: 60
      })
      .mockResolvedValueOnce({
        id: 'doc-processing-2',
        status: 'Processing',
        progress: 75
      });
    
    // 次のポーリングサイクルをシミュレート
    await act(async () => {
      // タイマーを実行
      jest.runOnlyPendingTimers();
      // すべてのマイクロタスクを完了
      await Promise.resolve();
    });
    
    // 次のポーリングが発生したことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledTimes(4);
    
    // クリーンアップ
    consoleErrorSpy.mockRestore();
  });

  // ドキュメント配列が変更された場合のテスト
  test('初期ドキュメント配列が変更された場合に新しいポーリングが開始されること', async () => {
    // 最初のポーリング用モック
    mockGetDocumentStatus.mockResolvedValue({
      id: 'doc-processing-1',
      status: 'Processing',
      progress: 75
    });

    // 初期ドキュメント配列
    const initialDocs = [createMockDocuments()[1]]; // 1つだけ処理中ドキュメントを含む

    // フックをレンダリング
    const { result, rerender } = renderHook(
      (props) => useDocumentStatusPolling(props.docs, 100), // テスト用に短いインターバル
      {
        initialProps: { docs: initialDocs }
      }
    );
    
    // 非同期処理の完了を待つ
    await act(async () => {
      // すべてのPromiseを解決
      await Promise.resolve();
    });
    
    // 処理中ドキュメントにポーリングが行われたことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledWith('doc-processing-1');
    
    // 別の処理中ドキュメントを含む新しい配列
    const newDocs: Document[] = [
      {
        id: 'doc-processing-3',
        title: 'New Processing Document',
        fileName: 'new.pdf',
        updatedAt: new Date().toISOString(),
        status: 'Processing',
        progress: 10,
        thumbnailUrl: 'https://via.placeholder.com/150',
      }
    ];
    
    // 新しいモックを設定
    mockGetDocumentStatus.mockReset();
    mockGetDocumentStatus.mockResolvedValue({
      id: 'doc-processing-3',
      status: 'Processing',
      progress: 30
    });
    
    // クリーンアップが完了するのを待つ（古いタイマーが解除されるのを待つ）
    await act(async () => {
      // 前のタイマーの実行を待つ
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    // フックを新しいドキュメント配列でレンダリング
    rerender({ docs: newDocs });
    
    // 新しいドキュメント配列への更新と初期ポーリングを待つ
    await act(async () => {
      // すべてのPromiseを解決
      await Promise.resolve();
    });
    
    // 新しいドキュメントに対するポーリングが行われたことを確認
    expect(mockGetDocumentStatus).toHaveBeenCalledWith('doc-processing-3');
    
    // 新しいドキュメントの進捗が更新されていることを確認（タイムアウト増加）
    await waitFor(() => {
      const updatedDoc = result.current.documents.find(d => d.id === 'doc-processing-3');
      expect(updatedDoc?.progress).toBe(30);
    }, { timeout: 3000 });
  });
});
