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
  
  // 他のAPIエンドポイントのモックもここに追加できます
];
