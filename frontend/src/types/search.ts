// ライブラリ検索用リクエスト型定義
export interface SearchLibraryRequest {
  keyword: string;
  sortBy?: string; // 例: 'relevance', 'updatedAt_desc'
}
