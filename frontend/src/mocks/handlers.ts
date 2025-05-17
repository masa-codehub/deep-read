import { http, HttpResponse } from 'msw';

/**
 * APIリクエストのモックハンドラ
 * 開発環境でのテスト用
 */

// ドキュメントごとの状態を保持（テスト・デモ用）
const documentStatuses: Record<string, { status: 'Processing' | 'Ready' | 'Error', progress: number, step: number }> = {};

export const handlers = [
  // PDFアップロードAPIのモック
  http.post('/api/documents/upload/', async ({ request }) => {
    // アップロードされたファイル情報を取得
    const formData = await request.formData();
    const file = formData.get('pdf_file');
    if (file instanceof File) {
      console.log('Mock API: Received file -', file.name, file.size, file.type);
    }

    // 成功シナリオ (200 OK)
    const newDocId = 'mock-doc-' + Math.floor(Math.random() * 1000);
    // アップロード直後は「処理中」ステータスで初期化
    documentStatuses[newDocId] = { status: 'Processing', progress: 0, step: 0 };
    return HttpResponse.json(
      {
        success: true,
        message: 'モック: ファイルのアップロードに成功しました。解析処理を開始します。',
        documentId: newDocId,
      },
      { status: 200 }
    );
    
    // 以下は必要に応じてコメントアウトを外して使用
    
    /*
    // ファイルサイズ超過エラーシナリオ (413 Payload Too Large)
    return HttpResponse.json(
      {
        success: false,
        error: 'モック: ファイルサイズが上限を超えています。 (最大100MB)',
      },
      { status: 413 }
    );
    */
    
    /*
    // サーバーエラーシナリオ (500 Internal Server Error)
    return HttpResponse.json(
      {
        success: false,
        error: 'モック: アップロード中にサーバーエラーが発生しました。',
      },
      { status: 500 }
    );
    */
    
    /*
    // CSRFエラーシナリオ (403 Forbidden)
    return HttpResponse.json(
      {
        success: false,
        error: 'モック: CSRF検証に失敗しました。',
      },
      { status: 403 }
    );
    */
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
        const status = ['Ready', 'Processing', 'Error'][Math.floor(Math.random() * 3)] as 'Ready' | 'Processing' | 'Error';
        documentStatuses[id] = {
          status,
          progress: status === 'Processing' ? Math.floor(Math.random() * 80) : 100,
          step: status === 'Processing' ? Math.floor(Math.random() * 4) : 5,
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
    if (current.status === 'Processing') {
      current.step += 1;
      current.progress = Math.min(current.step * 20, 100); // 5ステップで完了
      if (current.step >= 5) {
        // ランダムで成功かエラーか
        current.status = Math.random() > 0.3 ? 'Ready' : 'Error';
        current.progress = 100;
      }
    }
    return HttpResponse.json({ id: documentId, status: current.status, progress: current.progress });
  }),

  // 他のAPIエンドポイントのモックもここに追加できます
];
