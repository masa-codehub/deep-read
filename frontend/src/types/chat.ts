// チャット関連の型定義

export interface AskQuestionRequest {
  documentId: string;
  question: string;
}

export interface SourceReference {
  documentId: string;
  pageNumber?: number;
  qaId?: string;
  snippet?: string;
}

export interface Answer {
  text: string;
  /**
   * 回答に出典がない場合もあるため、空配列または省略可能とする
   */
  sourceReferences?: SourceReference[];
}

export interface AskQuestionResponse {
  answer: Answer;
}

export type ChatMessageType = 'question' | 'answer';

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  text: string;
  sources?: SourceReference[];
  timestamp: Date;
}
