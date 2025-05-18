/**
 * バックエンドAPIとの通信を担当するサービス
 * @module api
 */

/**
 * アップロードの進捗コールバック関数の型定義
 * @callback ProgressCallback
 * @param {number} progress - 0から100までの進捗率
 */
type ProgressCallback = (progress: number) => void;

/**
 * PDFファイルをアップロードする
 * 
 * @async
 * @function uploadPDFFile
 * @param {File} file - アップロードするPDFファイル
 * @param {ProgressCallback} [onProgress] - 進捗状況を通知するコールバック関数
 * @returns {Promise<{success: boolean, message: string, documentId?: string}>} サーバーからのレスポンスを含むPromise
 * @throws {Error} ネットワークエラー、サーバーエラー、またはバリデーションエラー時にスロー
 * 
 * @example
 * // 基本的な使用方法
 * try {
 *   const result = await uploadPDFFile(pdfFile);
 *   console.log(`アップロード成功: ${result.message}`);
 * } catch (error) {
 *   console.error(`アップロードエラー: ${error.message}`);
 * }
 * 
 * @example
 * // 進捗コールバック付きの使用方法
 * try {
 *   const result = await uploadPDFFile(pdfFile, (progress) => {
 *     console.log(`アップロード進捗: ${progress}%`);
 *     // UIのプログレスバーを更新
 *   });
 *   console.log(`アップロード成功: ${result.message}`);
 * } catch (error) {
 *   console.error(`アップロードエラー: ${error.message}`);
 * }
 */
export const uploadPDFFile = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; message: string; documentId?: string }> => {
  return new Promise((resolve, reject) => {
    // FormDataの作成とファイルの追加
    const formData = new FormData();
    formData.append('pdf_file', file);

    // XMLHttpRequestを使用して進捗を監視
    const xhr = new XMLHttpRequest();

    // 進捗イベントのリスナー
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // リクエスト完了時のハンドラ
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) { // リクエスト完了
        if (xhr.status >= 200 && xhr.status < 300) {
          // 成功時のレスポンス処理
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({
              success: true,
              message: response.message || 'ファイルのアップロードに成功しました。解析処理を開始します。',
              documentId: response.documentId
            });
          } catch (error) {
            resolve({
              success: true,
              message: 'ファイルのアップロードに成功しましたが、サーバーからの応答を解析できませんでした。',
            });
          }
        } else {
          // エラー時のレスポンス処理
          let errorMessage = 'アップロード中にエラーが発生しました。';
          
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.error) {
              errorMessage = response.error;
            }
          } catch (e) {
            // レスポンスがJSONでない場合や解析エラーの場合はデフォルトエラーメッセージを使用
            if (xhr.status === 413) {
              errorMessage = 'ファイルサイズが大きすぎます。';
            } else if (xhr.status === 415) {
              errorMessage = '対応していないファイル形式です。PDFファイルのみアップロード可能です。';
            } else if (xhr.status === 401) {
              errorMessage = '認証が必要です。ログインしてから再試行してください。';
            } else if (xhr.status === 403) {
              errorMessage = 'この操作を実行する権限がありません。';
            } else if (xhr.status >= 500) {
              errorMessage = 'サーバーエラーが発生しました。後ほど再試行してください。';
            }
          }
          
          reject(new Error(errorMessage));
        }
      }
    };

    // ネットワークエラーや中断のハンドラ
    xhr.onerror = () => {
      reject(new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。'));
    };

    xhr.ontimeout = () => {
      reject(new Error('リクエストがタイムアウトしました。後ほど再試行してください。'));
    };

    xhr.onabort = () => {
      reject(new Error('アップロードが中断されました。'));
    };

    // API エンドポイントとメソッドの設定
    // 注: エンドポイントはバックエンドの実際の仕様に合わせて変更が必要
    xhr.open('POST', '/api/documents/upload/', true);

    // 認証ヘッダーの追加 (CSRFトークンやAuthorizationヘッダーなど、必要に応じて)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    xhr.setRequestHeader('X-CSRFToken', csrfToken);

    // リクエスト送信
    xhr.send(formData);
  });
};

export interface Document {
  id: string;
  title: string;
  fileName: string;
  updatedAt: string;
  status: 'Ready' | 'Processing' | 'Error';
  progress?: number; // 進捗（0-100, Processing時のみ）
  thumbnailUrl?: string;
}

export interface PaginatedDocumentsResponse {
  documents: Document[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export const getLibraryDocuments = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedDocumentsResponse> => {
  const response = await fetch(`/api/library/documents?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch library documents');
  }
  return response.json() as Promise<PaginatedDocumentsResponse>;
};

/**
 * ドキュメントの最新ステータス・進捗を取得するAPI
 * @param documentId
 * @returns {Promise<{id: string, status: 'Ready' | 'Processing' | 'Error', progress: number}>}
 */
export const getDocumentStatus = async (
  documentId: string
): Promise<{ id: string; status: 'Ready' | 'Processing' | 'Error'; progress: number }> => {
  const response = await fetch(`/api/documents/${documentId}/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch document status');
  }
  return response.json();
};