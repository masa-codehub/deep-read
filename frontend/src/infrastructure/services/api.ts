/**
 * バックエンドAPIとの通信を担当するサービス
 * @module api
 */

import type { DocumentStatusOutputData } from '../../types/document';
import { PaginatedDocumentsResponse } from '../../types/paginatedDocumentsResponse';
import { getCsrfToken } from '../../utils/csrf';

/**
 * PDFファイルをアップロードする
 * 
 * @async
 * @function uploadPDFFile
 * @param {File} file - アップロードするPDFファイル
 * @returns {Promise<{success: boolean, message: string, documentId?: string}>} サーバーからのレスポンスを含むPromise
 * @throws {Error} ネットワークエラー、サーバーエラー、またはバリデーションエラー時にスロー
 * @note fetch版では進捗コールバック(onProgress)は未対応です。
 */
export const uploadPDFFile = async (
  file: File
): Promise<{ success: boolean; message: string; documentId?: string }> => {
  const formData = new FormData();
  formData.append('pdf_file', file);

  // fetchでアップロード
  try {
    const csrfToken = getCsrfToken();
    const response = await fetch('/api/documents/upload/', {
      method: 'POST',
      body: formData,
      headers: {
        ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || 'ファイルのアップロードに成功しました。解析処理を開始します。',
        documentId: data.documentId,
      };
    } else {
      let errorMessage = 'アップロード中にエラーが発生しました。';
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          if (response.status === 413) errorMessage = 'ファイルサイズが大きすぎます。';
          else if (response.status === 415) errorMessage = '対応していないファイル形式です。PDFファイルのみアップロード可能です。';
          else if (response.status === 401) errorMessage = '認証が必要です。ログインしてから再試行してください。';
          else if (response.status === 403) errorMessage = 'この操作を実行する権限がありません。';
          else if (response.status >= 500) errorMessage = 'サーバーエラーが発生しました。後ほど再試行してください。';
        }
      } catch (e) {
        if (response.status === 413) errorMessage = 'ファイルサイズが大きすぎます。';
        else if (response.status === 415) errorMessage = '対応していないファイル形式です。PDFファイルのみアップロード可能です。';
        else if (response.status === 401) errorMessage = '認証が必要です。ログインしてから再試行してください。';
        else if (response.status === 403) errorMessage = 'この操作を実行する権限がありません。';
        else if (response.status >= 500) errorMessage = 'サーバーエラーが発生しました。後ほど再試行してください。';
      }
      throw new Error(errorMessage);
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('アップロード中に不明なエラーが発生しました。');
  }
};

/**
 * ドキュメントの最新ステータス・進捗を取得するAPI
 * @param documentId
 * @returns {Promise<DocumentStatusOutputData>}
 */
export const getDocumentStatus = async (
  documentId: string
): Promise<DocumentStatusOutputData> => {
  const response = await fetch(`/api/documents/${documentId}/status`);
  if (!response.ok) {
    throw new Error('Failed to fetch document status');
  }
  return response.json();
}

/**
 * 複数ドキュメントの最新ステータス・進捗を取得するAPI
 * @param documentIds
 * @returns {Promise<DocumentStatusOutputData[]>}
 */
export const getDocumentStatuses = async (
  documentIds: string[]
): Promise<DocumentStatusOutputData[]> => {
  const params = new URLSearchParams();
  params.set('ids', documentIds.join(','));
  const response = await fetch(`/api/documents/statuses?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch document statuses');
  }
  return response.json();
};

/**
 * ドキュメント一覧を取得するAPI
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @returns {Promise<PaginatedDocumentsResponse>}
 */
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