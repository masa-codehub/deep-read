import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from './useChat';
import * as api from '../../infrastructure/services/api';

vi.mock('../../infrastructure/services/api', () => ({
  askSingleDocumentQuestion: vi.fn(),
}));

export {};

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態は空', () => {
    const { result } = renderHook(() => useChat('doc-1'));
    expect(result.current.messages).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('submitQuestionで質問・回答が追加される', async () => {
    const mockAsk = api.askSingleDocumentQuestion as unknown as ReturnType<typeof vi.fn>;
    mockAsk.mockResolvedValue({
      answer: {
        text: 'AI回答',
        sourceReferences: [
          { documentId: 'doc-1', pageNumber: 2 }
        ]
      }
    });
    const { result } = renderHook(() => useChat('doc-1'));
    await act(async () => {
      await result.current.submitQuestion('質問テスト');
    });
    expect(result.current.messages[0].type).toBe('question');
    expect(result.current.messages[1].type).toBe('answer');
    expect(result.current.messages[1].text).toBe('AI回答');
    expect(result.current.messages[1].sources?.[0].pageNumber).toBe(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('APIエラー時はerrorがセットされる', async () => {
    const mockAsk = api.askSingleDocumentQuestion as unknown as ReturnType<typeof vi.fn>;
    mockAsk.mockRejectedValue(new Error('サーバーエラー'));
    const { result } = renderHook(() => useChat('doc-1'));
    await act(async () => {
      await result.current.submitQuestion('エラー質問');
    });
    expect(result.current.error).toBe('サーバーエラー');
    expect(result.current.isLoading).toBe(false);
  });
});
