import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useFileUpload } from './useFileUpload';
import { uploadPDFFile } from '../../infrastructure/services/api';

// APIをモック化
vi.mock('../../infrastructure/services/api');
// uploadPDFFileの型をvi.fnの戻り値型でキャスト
const mockUploadPDFFile = uploadPDFFile as unknown as ReturnType<typeof vi.fn>;

// モックファイルオブジェクトを作成するヘルパー関数
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('useFileUpload', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();
    
    // デフォルトのモック実装
    mockUploadPDFFile.mockResolvedValue({
      success: true,
      message: 'アップロードに成功しました',
      documentId: 'mock-doc-id'
    });
  });

  // 初期状態をテスト
  test('初期状態が正しく設定されていること', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.uploadStatus).toBe('idle');
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.resultMessage).toBe('');
    expect(result.current.uploadedDocumentId).toBeNull();
  });

  // ファイル選択をテスト
  test('handleFileSelectでファイル選択状態が更新されること', () => {
    const { result } = renderHook(() => useFileUpload());
    
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    expect(result.current.selectedFile).toBe(mockFile);
    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.uploadStatus).toBe('idle');
    expect(result.current.resultMessage).toBe('');
    expect(result.current.uploadProgress).toBe(0);
  });

  // アップロード処理のテスト
  test('handleUploadStartでアップロードが正常に処理されること', async () => {
    const { result } = renderHook(() => useFileUpload());

    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    
    // ファイル選択
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    // アップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // アップロード中の状態を確認
    expect(result.current.uploadStatus).toBe('uploading');

    // アップロードの処理が完了するのを待つ
    await waitFor(() => {
      expect(result.current.uploadStatus).toBe('success');
    });
    
    // APIが呼ばれたか確認
    expect(mockUploadPDFFile).toHaveBeenCalledWith(mockFile, expect.any(Function));
    
    // 成功状態の確認
    expect(result.current.resultMessage).toBe('アップロードに成功しました');
    expect(result.current.uploadedDocumentId).toBe('mock-doc-id');
  });

  // アップロード進捗の通知をテスト
  test('アップロード進捗コールバックで進捗が更新されること', async () => {
    // 進捗コールバック用の特別なモック実装
    let progressCallback: ((progress: number) => void) | undefined;
    mockUploadPDFFile.mockImplementationOnce((file, onProgress) => {
      // コールバックを保存
      progressCallback = onProgress;
      // 非同期で成功を返す
      return Promise.resolve({ success: true, message: 'アップロード成功', documentId: 'doc-id' });
    });
    
    const { result } = renderHook(() => useFileUpload());
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    
    // ファイル選択
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    // アップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // 初期進捗は0%
    expect(result.current.uploadProgress).toBe(0);
    
    // 疑似的に進捗コールバックを呼び出す（50%完了）
    act(() => {
      // TypeScriptのNullチェックを追加
      if (progressCallback) progressCallback(50);
    });
    
    // 進捗が更新されたことを確認
    expect(result.current.uploadProgress).toBe(50);
    
    // 100%完了を通知
    act(() => {
      if (progressCallback) progressCallback(100);
    });
    
    // 進捗が100%になったことを確認
    expect(result.current.uploadProgress).toBe(100);
    
    // アップロードの完了を待つ
    await waitFor(() => {
      expect(result.current.uploadStatus).toBe('success');
    });
  });

  // エラー処理のテスト
  test('アップロードエラー時にエラー状態が正しく設定されること', async () => {
    // エラーを返すモック実装
    const errorMessage = 'ファイルサイズが上限を超えています';
    mockUploadPDFFile.mockRejectedValueOnce(new Error(errorMessage));
    
    const { result } = renderHook(() => useFileUpload());
    const mockFile = createMockFile('large.pdf', 100 * 1024 * 1024, 'application/pdf');
    
    // ファイル選択
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    // アップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // エラー状態の確認
    await waitFor(() => {
      expect(result.current.uploadStatus).toBe('error');
    });
    
    expect(result.current.resultMessage).toBe(errorMessage);
  });

  // 選択されたファイルがない場合のエラー処理
  test('ファイルが選択されていない場合にエラーになること', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    // ファイルを選択せずにアップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // エラーが発生したことを確認
    expect(result.current.uploadStatus).toBe('error');
    expect(result.current.resultMessage).toBe('アップロードするファイルが選択されていません。');
    
    // APIは呼ばれていないこと
    expect(mockUploadPDFFile).not.toHaveBeenCalled();
  });

  // モーダルを閉じる処理のテスト
  test('handleModalCloseでモーダルが閉じられ、状態が適切にリセットされること', async () => {
    const { result } = renderHook(() => useFileUpload());

    // アップロード完了状態を作る
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    // アップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // アップロード成功を待つ
    await waitFor(() => {
      expect(result.current.uploadStatus).toBe('success');
    });
    
    // モーダルを閉じる
    act(() => {
      result.current.handleModalClose();
    });
    
    // モーダルが閉じられ、状態がリセットされていることを確認
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.resultMessage).toBe('');
    expect(result.current.selectedFile).toBeNull(); // アップロード成功時はファイル選択もリセット
  });

  // アップロード中にモーダルを閉じた場合のテスト
  test('アップロード中にモーダルを閉じても進捗状態はリセットされないこと', () => {
    // 応答を返さない特別なモック
    let resolveUpload: any;
    mockUploadPDFFile.mockImplementationOnce((file, onProgress) => {
      return new Promise(resolve => {
        resolveUpload = resolve;
        if (onProgress) onProgress(30); // 進捗30%
      });
    });
    
    const { result } = renderHook(() => useFileUpload());
    
    // ファイル選択とアップロード開始
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    act(() => {
      result.current.handleUploadStart();
    });
    
    // アップロード中の状態と進捗を確認
    expect(result.current.uploadStatus).toBe('uploading');
    expect(result.current.uploadProgress).toBe(30);
    
    // モーダルを閉じても
    act(() => {
      result.current.handleModalClose();
    });
    
    // モーダルは閉じるが進捗状態は維持される
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.uploadStatus).toBe('uploading');
    expect(result.current.uploadProgress).toBe(30);
  });

  // 状態リセット機能のテスト
  test('resetUploadStateですべての状態が初期化されること', async () => {
    const { result } = renderHook(() => useFileUpload());
    
    // いくつかの状態を変更
    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    act(() => {
      result.current.handleFileSelect(mockFile);
    });
    
    // アップロード開始
    act(() => {
      result.current.handleUploadStart();
    });
    
    // アップロード成功を待つ
    await waitFor(() => {
      expect(result.current.uploadStatus).toBe('success');
    });
    
    // リセット実行
    act(() => {
      result.current.resetUploadState();
    });
    
    // すべての状態が初期化されていることを確認
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.uploadStatus).toBe('idle');
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.resultMessage).toBe('');
    expect(result.current.uploadedDocumentId).toBeNull();
  });
});
