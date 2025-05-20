/**
 * バックエンドAPIとの通信を担当するサービス
 * @module api
 */

import type { DocumentStatusOutputData } from '../../types/document';
import { PaginatedDocumentsResponse } from '../../types/paginatedDocumentsResponse';
import { getCsrfToken } from '../../utils/csrf';
import type { AskQuestionRequest, AskQuestionResponse } from '../../types/chat';
import type { SearchLibraryRequest } from '../../types/search';
import type {
  UserSettingsData,
  UserSettingsInputData,
  UpdateUserSettingsResponse
} from '../../types/settings';

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
        if (errorData?.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = getErrorMessageFromStatus(response.status, errorMessage);
        }
      } catch (jsonError) {
        errorMessage = getErrorMessageFromStatus(response.status, errorMessage);
        console.error("Failed to parse error response JSON:", jsonError);
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
 * ユーザー登録API
 * @param email メールアドレス
 * @param password パスワード
 * @returns {Promise<{ success: boolean; message?: string; errors?: Record<string, string> }>}
 */
export interface ApiErrorResponse {
  success: false;
  message: string; // messageは必須
  errors?: Record<string, string | string[]>;
}

export interface RegisterUserSuccessResponse {
  success: true;
}

export type RegisterUserResponse = RegisterUserSuccessResponse | ApiErrorResponse;

export const registerUser = async (
  email: string,
  password: string
): Promise<RegisterUserResponse> => {
  try {
    const csrfToken = getCsrfToken();
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRFToken': csrfToken }),
      },
      body: JSON.stringify({ email, password }),
    });
    if (response.ok) {
      return { success: true };
    } else {
      let errorMessage = '登録中にエラーが発生しました。';
      let errors: Record<string, string | string[]> = {};
      try {
        const data = await response.json();
        if (data.errors) {
          errors = data.errors;
        }
        if (data.message) {
          errorMessage = data.message;
        } else if (typeof data.error === 'string' && !data.errors) {
          errorMessage = data.error;
          if (Object.keys(errors).length === 0) errors.form = data.error;
        }
        if (errorMessage === '登録中にエラーが発生しました。' && Object.keys(errors).length === 0) {
          errorMessage = getErrorMessageFromStatus(response.status, errorMessage);
        }
      } catch (e) {
        console.error("Failed to parse error JSON or process error data:", e);
        errorMessage = getErrorMessageFromStatus(response.status, errorMessage);
      }
      return { success: false, message: errorMessage, errors };
    }
  } catch (error) {
    console.error("Registration API call failed:", error);
    return { success: false, message: 'ネットワークエラーが発生しました。接続を確認してください。' };
  }
};

/**
 * ステータスコードに応じた共通エラーメッセージを返す
 */
function getErrorMessageFromStatus(status: number, defaultMessage: string): string {
  switch (status) {
    case 400:
      return '入力内容に誤りがあります。';
    case 401:
      return '認証が必要です。ログインしてから再試行してください。';
    case 403:
      return 'この操作を実行する権限がありません。';
    case 409:
      return 'このメールアドレスは既に使用されています。';
    case 413:
      return 'ファイルサイズが大きすぎます。';
    case 415:
      return '対応していないファイル形式です。PDFファイルのみアップロード可能です。';
    default:
      if (status >= 500) return 'サーバーエラーが発生しました。後ほど再試行してください。';
      return defaultMessage;
  }
}

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

/**
 * ユーザー設定を取得するAPI
 * @returns {Promise<UserSettingsData>}
 */
export const getUserSettings = async (): Promise<UserSettingsData> => {
  const csrfToken = getCsrfToken();
  const response = await fetch('/api/settings', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
    credentials: 'include',
  });
  if (!response.ok) {
    let errorMessage = 'ユーザー設定の取得に失敗しました。';
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {}
    throw new Error(errorMessage);
  }
  return response.json();
};

/**
 * ユーザー設定を更新するAPI
 * @param settings - 更新する設定値
 * @returns {Promise<UpdateUserSettingsResponse>}
 */
export const updateUserSettings = async (
  settings: UserSettingsInputData
): Promise<UpdateUserSettingsResponse> => {
  const csrfToken = getCsrfToken();
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRFToken': csrfToken }),
    },
    credentials: 'include',
    body: JSON.stringify(settings),
  });
  const data = await response.json();
  if (response.ok) {
    return data;
  } else {
    return {
      success: false,
      message: data.message || '設定の保存に失敗しました。',
      errors: data.errors,
    };
  }
};