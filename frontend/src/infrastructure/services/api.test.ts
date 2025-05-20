import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { uploadPDFFile, searchLibraryDocuments, getLegalConsentStatus, agreeToLegalTerms } from './api';

const apiUrl = '/api/legal';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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

  describe('searchLibraryDocuments', () => {
    const endpoint = '/api/library/search';
    it('正常に検索結果を返す', async () => {
      const mockResponse = { documents: [{ id: '1', title: 'doc' }], totalCount: 1 };
      server.use(
        http.get(endpoint, async ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('keyword')).toBe('test');
          expect(url.searchParams.get('sortBy')).toBeNull();
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );
      const result = await searchLibraryDocuments({ keyword: 'test' });
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toBe('doc');
    });
    it('sortByパラメータ付きで検索できる', async () => {
      const mockResponse = { documents: [{ id: '2', title: 'sorted doc' }], totalCount: 1 };
      server.use(
        http.get(endpoint, async ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('keyword')).toBe('test');
          expect(url.searchParams.get('sortBy')).toBe('date');
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );
      // sortByは現状UIから渡らないがAPIとしてはテスト
      const result = await searchLibraryDocuments({ keyword: 'test', sortBy: 'date' });
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].title).toBe('sorted doc');
    });
    it('APIエラー時は詳細なエラーメッセージを投げる', async () => {
      server.use(
        http.get(endpoint, async ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('keyword')).toBe('test');
          return HttpResponse.json({ message: '認証が必要です。ログインしてください。' }, { status: 401 });
        })
      );
      await expect(searchLibraryDocuments({ keyword: 'test' })).rejects.toThrow('認証が必要です。ログインしてください。');
    });
    it('AbortControllerでキャンセルできる', async () => {
      server.use(
        http.get(endpoint, async ({ request }) => {
          // 実際のリクエスト内容は検証しない
          return new Promise(() => {}); // never resolves
        })
      );
      const controller = new AbortController();
      controller.abort();
      await expect(searchLibraryDocuments({ keyword: 'test' }, controller.signal)).rejects.toThrow();
    });
  });

  describe('getLegalConsentStatus', () => {
    it('正常に同意状況を取得できる', async () => {
      const status = await getLegalConsentStatus();
      expect(status.userId).toBe('u1');
      expect(status.hasAgreedToLatestTerms).toBe(false);
    });

    it('エラー時に例外を投げる', async () => {
      server.use(
        http.get(`${apiUrl}/consent-status`, async () => HttpResponse.text('', { status: 500 }))
      );
      await expect(getLegalConsentStatus()).rejects.toThrow('サーバーエラーが発生しました。後ほど再試行してください。');
    });
  });

  describe('agreeToLegalTerms', () => {
    it('正常に同意できる', async () => {
      await expect(
        agreeToLegalTerms({ userId: 'u1', termsVersion: 'v2', privacyPolicyVersion: 'v2' })
      ).resolves.toBeUndefined();
    });

    it('エラー時に例外を投げる', async () => {
      server.use(
        http.post(`${apiUrl}/agree`, async () => HttpResponse.json({ message: '同意失敗' }, { status: 400 }))
      );
      await expect(
        agreeToLegalTerms({ userId: 'u1', termsVersion: 'v2', privacyPolicyVersion: 'v2' })
      ).rejects.toThrow('同意失敗');
    });
  });
});