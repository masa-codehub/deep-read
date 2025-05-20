import { http, HttpResponse } from 'msw';
import type { ProcessingStatus } from '../types/document';

/**
 * APIリクエストのモックハンドラ
 * 開発環境でのテスト用
 */

// ドキュメントごとの状態を保持（テスト・デモ用）
const documentStatuses: Record<string, { status: ProcessingStatus; progress: number; step: number }> = {};

const ALL_STATUSES: ProcessingStatus[] = ['READY', 'PROCESSING', 'ERROR'];

export const handlers = [
  // PDFアップロードAPIのモック
  http.post('/api/documents/upload/', async ({ request }) => {
    // アップロードされたファイル情報を取得
    const formData = await request.formData();
    const file = formData.get('pdf_file');
    if (file instanceof File) {
      console.log('Mock API: Received file -', file.name, file.size, file.type);
    }
    // 常に成功シナリオのみ返す（エラーはテスト側でserver.use()で上書き）
    const newDocId = 'mock-doc-' + Math.floor(Math.random() * 1000);
    documentStatuses[newDocId] = { status: 'PROCESSING', progress: 0, step: 0 };
    return HttpResponse.json(
      {
        success: true,
        message: 'モック: ファイルのアップロードに成功しました。解析処理を開始します。',
        documentId: newDocId,
      },
      { status: 200 }
    );
  }),

  // ドキュメント一覧取得APIのモック
  http.get('/api/library/documents', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const mockDocuments = Array.from({ length: 25 }, (_, i) => {
      const id = `doc${i + 1}`;
      // 初回アクセス時はランダムな状態で初期化
      if (!documentStatuses[id]) {
        const status = ALL_STATUSES[Math.floor(Math.random() * ALL_STATUSES.length)];
        documentStatuses[id] = {
          status,
          progress: status === 'PROCESSING' ? Math.floor(Math.random() * 80) : 100,
          step: status === 'PROCESSING' ? Math.floor(Math.random() * 4) : 5,
        };
      }
      return {
        id,
        title: `サンプルドキュメント ${i + 1}`,
        fileName: `sample_document_${i + 1}.pdf`,
        updatedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        thumbnailUrl: `https://via.placeholder.com/150/0000FF/808080?Text=Doc${i + 1}`,
        ...documentStatuses[id],
      };
    });

    const paginatedDocuments = mockDocuments.slice(offset, offset + limit);

    return HttpResponse.json({
      documents: paginatedDocuments,
      totalCount: mockDocuments.length,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(mockDocuments.length / limit),
    });
  }),
  
  // ドキュメントごとのステータス取得API（ポーリング用）
  http.get('/api/documents/:documentId/status', ({ params }) => {
    const { documentId } = params;
    if (typeof documentId !== 'string' || !documentStatuses[documentId]) {
      return new HttpResponse(null, { status: 404 });
    }
    const current = documentStatuses[documentId];
    // ステータス進行ロジック
    if (current.status === 'PROCESSING') {
      current.step += 1;
      current.progress = Math.min(current.step * 20, 100); // 5ステップで完了
      if (current.step >= 5) {
        // ランダムで成功かエラーか
        current.status = Math.random() > 0.3 ? 'READY' : 'ERROR';
        current.progress = 100;
      }
    }
    return HttpResponse.json({ id: documentId, status: current.status, progress: current.progress });
  }),

  // --- ここから追加 ---
  // doc1, doc2, doc3 の初期状態を明示的にセット
  http.get('http://localhost/api/documents/statuses', ({ request }) => {
    const url = new URL(request.url);
    const idsQueryParam = url.searchParams.get('ids');
    if (!idsQueryParam) {
      return HttpResponse.json([], { status: 200 });
    }
    const requestedIds = idsQueryParam.split(',');
    const statuses = requestedIds.map(id => {
      const doc = documentStatuses[id];
      if (!doc) return undefined;
      return {
        id,
        status: doc.status,
        progress: doc.progress,
        title: `サンプルドキュメント ${id.replace(/\D/g, '')}`,
        fileName: `${id}.pdf`,
        uploaded_at: new Date().toISOString(),
      };
    }).filter(Boolean);
    return HttpResponse.json(statuses, { status: 200 });
  }),
  // --- ここまで追加 ---

  // ユーザー設定取得APIのモック
  http.get('/api/settings', () => {
    return HttpResponse.json({
      apiKey: 'sk-test-1234abcd5678efgh',
      fileUploadLimitMB: 50,
    }, { status: 200 });
  }),

  // ユーザー設定更新APIのモック
  http.put('/api/settings', async ({ request }) => {
    const body = await request.json();
    // バリデーション例: fileUploadLimitMBが数値で1以上1000以下
    if (typeof body.fileUploadLimitMB !== 'number' || body.fileUploadLimitMB < 1 || body.fileUploadLimitMB > 1000) {
      return HttpResponse.json({
        success: false,
        message: 'ファイル上限は1〜1000MBの数値で入力してください。',
        errors: { fileUploadLimitMB: '1〜1000の数値で入力してください。' },
      }, { status: 400 });
    }
    // APIキーのバリデーション例
    if (body.apiKey !== undefined && typeof body.apiKey !== 'string') {
      return HttpResponse.json({
        success: false,
        message: 'APIキーの形式が不正です。',
        errors: { apiKey: 'APIキーの形式が不正です。' },
      }, { status: 400 });
    }
    // 成功時
    return HttpResponse.json({
      success: true,
      message: '設定を保存しました',
      updatedSettings: {
        apiKey: body.apiKey ?? 'sk-test-1234abcd5678efgh',
        fileUploadLimitMB: body.fileUploadLimitMB,
      },
    }, { status: 200 });
  }),
];

// doc1の進捗を2秒ごとに10%ずつ進め、100%でReadyにする
setInterval(() => {
  const doc = documentStatuses['doc1'];
  if (doc && doc.status === 'PROCESSING') {
    doc.progress = Math.min(doc.progress + 10, 100);
    if (doc.progress === 100) {
      doc.status = 'READY';
    }
  }
}, 2000);

// 初期状態を明示的にセット
if (!documentStatuses['doc1']) {
  documentStatuses['doc1'] = { status: 'PROCESSING', progress: 0, step: 0 };
}
if (!documentStatuses['doc2']) {
  documentStatuses['doc2'] = { status: 'READY', progress: 100, step: 5 };
}
if (!documentStatuses['doc3']) {
  documentStatuses['doc3'] = { status: 'ERROR', progress: 0, step: 0 };
}
