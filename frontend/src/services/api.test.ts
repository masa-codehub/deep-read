import { uploadPDFFile } from './api';

// XMLHttpRequestのモック
const xhrMock: Partial<XMLHttpRequest> = {
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
  readyState: 4,
  status: 200,
  responseText: JSON.stringify({ message: 'アップロード成功', documentId: 'doc123' }),
  upload: {
    addEventListener: jest.fn()
  } as any
};

// グローバルにXMLHttpRequestをモック
global.XMLHttpRequest = jest.fn(() => xhrMock as XMLHttpRequest) as any;

describe('API Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadPDFFile', () => {
    test('uploads file and resolves promise on success', async () => {
      // モック処理をセットアップ
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const progressCallback = jest.fn();

      // リクエスト完了イベントをシミュレーション
      const promise = uploadPDFFile(file, progressCallback);
      
      // onreadystatechangeハンドラを手動で呼び出し
      const readyStateChangeHandler = (xhrMock as any).onreadystatechange;
      if (readyStateChangeHandler) {
        readyStateChangeHandler();
      }

      // レスポンスを確認
      const result = await promise;
      expect(result).toEqual({
        success: true,
        message: 'アップロード成功',
        documentId: 'doc123'
      });

      // APIのパラメータと設定を確認
      expect(xhrMock.open).toHaveBeenCalledWith('POST', '/api/documents/upload/', true);
      expect(xhrMock.send).toHaveBeenCalled();
    });

    test('registers progress callback correctly', async () => {
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const progressCallback = jest.fn();

      await uploadPDFFile(file, progressCallback).catch(() => {});

      // progress イベントリスナーが登録されたことを確認
      expect(xhrMock.upload?.addEventListener).toHaveBeenCalledWith('progress', expect.any(Function));
      
      // progress イベントをシミュレート
      const progressHandler = (xhrMock.upload?.addEventListener as jest.Mock).mock.calls[0][1];
      progressHandler({ lengthComputable: true, loaded: 50, total: 100 }); // 50%の進捗
      
      // コールバックが正しく呼び出されたことを確認
      expect(progressCallback).toHaveBeenCalledWith(50);
    });

    test('rejects promise on HTTP error', async () => {
      // エラーステータスをセット
      Object.defineProperty(xhrMock, 'status', { value: 413 });
      Object.defineProperty(xhrMock, 'responseText', { value: JSON.stringify({ error: 'ファイルサイズが大きすぎます' }) });

      const file = new File(['dummy content'], 'toolarge.pdf', { type: 'application/pdf' });

      // リクエストを実行
      const promise = uploadPDFFile(file);
      
      // エラー処理をシミュレート
      const readyStateChangeHandler = (xhrMock as any).onreadystatechange;
      if (readyStateChangeHandler) {
        readyStateChangeHandler();
      }

      // エラーが正しくrejectされることを確認
      await expect(promise).rejects.toThrow('ファイルサイズが大きすぎます');
    });

    test('rejects promise on network error', async () => {
      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      
      const promise = uploadPDFFile(file);
      
      // ネットワークエラーをシミュレート
      const errorHandler = (xhrMock as any).onerror;
      if (errorHandler) {
        errorHandler(new Error('Network Error'));
      }

      await expect(promise).rejects.toThrow('ネットワークエラーが発生しました');
    });
  });
});