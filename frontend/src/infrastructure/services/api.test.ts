import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { uploadPDFFile } from './api';

describe('API Services', () => {
  describe('uploadPDFFile', () => {
    const endpoint = '/api/documents/upload/';

    it('正常にファイルがアップロードされ、成功レスポンスを解決すること', async () => {
      const mockSuccessResponse = { success: true, message: 'アップロード成功(MSW)', documentId: 'msw-doc-id-123' };
      server.use(
        http.post(endpoint, async () => {
          return HttpResponse.json(mockSuccessResponse, { status: 200 });
        })
      );

      const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
      const result = await uploadPDFFile(file);

      expect(result.success).toBe(true);
      expect(result.message).toBe('アップロード成功(MSW)');
      expect(result.documentId).toBe('msw-doc-id-123');
    });

    it.skip('registers progress callback correctly', () => {
      // fetch版では進捗コールバックは未対応のためスキップ (コメントは明確に)
    });

    it('HTTPエラー (413) 発生時にPromiseが適切なエラーメッセージでリジェクトされること', async () => {
      const errorMessageFromServer = 'ファイルサイズが大きすぎます(MSW)';
      server.use(
        http.post(endpoint, async () => {
          return HttpResponse.json({ error: errorMessageFromServer }, { status: 413 });
        })
      );

      const file = new File(['dummy content'], 'toolarge.pdf', { type: 'application/pdf' });
      await expect(uploadPDFFile(file)).rejects.toThrow(errorMessageFromServer);
    });

    it('サーバーがJSONでないエラーを返した場合 (例: 500でHTMLエラーページ) でも、汎用エラーメッセージでリジェクトされること', async () => {
      server.use(
        http.post(endpoint, async () => {
          return new HttpResponse("<html><body>Internal Server Error</body></html>", { status: 500, headers: {'Content-Type': 'text/html'} });
        })
      );
      const file = new File(['dummy content'], 'servererror.pdf', { type: 'application/pdf' });
      await expect(uploadPDFFile(file)).rejects.toThrow('サーバーエラーが発生しました。後ほど再試行してください。');
    });

    it('ネットワークエラー発生時にPromiseが適切なエラーメッセージでリジェクトされること', async () => {
      server.use(
        http.post(endpoint, () => {
          return HttpResponse.error();
        })
      );
      const file = new File(['dummy content'], 'network-error.pdf', { type: 'application/pdf' });
      await expect(uploadPDFFile(file)).rejects.toThrow('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    });
  });
});