/**
 * バックエンドAPIとの通信を担当するサービス
 * @module api
 */

import type { DocumentStatusOutputData } from '../../types/document';
import { PaginatedDocumentsResponse } from '../../types/paginatedDocumentsResponse';
import { getCsrfToken } from '../../utils/csrf';
import type { AskQuestionRequest, AskQuestionResponse } from '../../types/chat';
import type { SearchLibraryRequest } from '../../types/search';

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

/**
 * 単一ドキュメントQ&A: 質問を送信しAI回答を取得するAPI
 * @param {AskQuestionRequest} params - ドキュメントIDと質問
 * @returns {Promise<AskQuestionResponse>} 回答と出典情報
 */
export const askSingleDocumentQuestion = async (
  params: AskQuestionRequest
): Promise<AskQuestionResponse> => {
  const csrfToken = getCsrfToken();
  const response = await fetch(`/api/documents/${params.documentId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
    body: JSON.stringify({ question: params.question }),
  });
  if (!response.ok) {
    let errorMessage = '質問送信中にエラーが発生しました。';
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {}
    throw new Error(errorMessage);
  }
  return response.json();
};

/**
 * ライブラリ内のドキュメントをキーワードで検索するAPI呼び出し
 * @param params - 検索リクエストパラメータ
 * @param signal - AbortControllerのsignal（省略可）
 * @returns 検索結果
 */
export async function searchLibraryDocuments(
  params: SearchLibraryRequest,
  signal?: AbortSignal
): Promise<PaginatedDocumentsResponse> {
  const urlParams = new URLSearchParams({ keyword: params.keyword });
  if (params.sortBy) urlParams.append('sortBy', params.sortBy);
  const res = await fetch(`/api/library/search?${urlParams.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
    signal,
  });
  if (!res.ok) {
    let errorMessage = '検索APIの呼び出しに失敗しました';
    try {
      const errorData = await res.json();
      if (errorData.message) errorMessage = errorData.message;
      else if (res.status === 401) errorMessage = '認証が必要です。ログインしてください。';
      else if (res.status === 403) errorMessage = '権限がありません。';
      else if (res.status === 400) errorMessage = 'リクエストが不正です。';
      else if (res.status >= 500) errorMessage = 'サーバーエラーが発生しました。';
    } catch {}
    throw new Error(errorMessage);
  }
  return res.json();
}