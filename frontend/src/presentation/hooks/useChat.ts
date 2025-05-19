import { useState, useCallback } from 'react';
import type { AskQuestionRequest, AskQuestionResponse, ChatMessage, SourceReference } from '../../types/chat';
import { askSingleDocumentQuestion } from '../../infrastructure/services/api';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  submitQuestion: (questionText: string) => Promise<void>;
}

export const useChat = (documentId: string): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestion = useCallback(async (questionText: string) => {
    if (!questionText.trim()) return;
    const newQuestion: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'question',
      text: questionText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newQuestion]);
    setIsLoading(true);
    setError(null);
    try {
      const requestData: AskQuestionRequest = { documentId, question: questionText };
      const response: AskQuestionResponse = await askSingleDocumentQuestion(requestData);
      const newAnswer: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'answer',
        text: response.answer.text,
        sources: response.answer.sourceReferences,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newAnswer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  return { messages, isLoading, error, submitQuestion };
};
