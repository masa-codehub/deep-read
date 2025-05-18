// ドキュメント関連の共通型定義

export type ProcessingStatus = 'PROCESSING' | 'READY' | 'ERROR';

export interface Document {
  id: string;
  title: string;
  fileName: string;
  updatedAt: string;
  status: ProcessingStatus;
  progress?: number; // 進捗（0-100, PROCESSING時のみ）
  thumbnailUrl?: string;
}

export interface DocumentStatusOutputData {
  id: string;
  status: ProcessingStatus;
  progress: number;
  error_message?: string;
  title?: string;
  fileName?: string;
  uploaded_at?: string;
}
