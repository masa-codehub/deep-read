import { http, HttpResponse } from 'msw';

/**
 * APIリクエストのモックハンドラ
 * 開発環境でのテスト用
 */
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
    return HttpResponse.json(
      {
        success: true,
        message: 'モック: ファイルのアップロードに成功しました。解析処理を開始します。',
        documentId: 'mock-doc-' + Math.floor(Math.random() * 1000),
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

    const mockDocuments = Array.from({ length: 25 }, (_, i) => ({
      id: `doc${i + 1}`,
      title: `サンプルドキュメント ${i + 1}`,
      fileName: `sample_document_${i + 1}.pdf`,
      updatedAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      status: ['Ready', 'Processing', 'Error'][Math.floor(Math.random() * 3)] as 'Ready' | 'Processing' | 'Error',
      thumbnailUrl: `https://via.placeholder.com/150/0000FF/808080?Text=Doc${i + 1}`
    }));

    const paginatedDocuments = mockDocuments.slice(offset, offset + limit);

    return HttpResponse.json({
      documents: paginatedDocuments,
      totalCount: mockDocuments.length,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(mockDocuments.length / limit),
    });
  }),
  
  // 他のAPIエンドポイントのモックもここに追加できます
];
