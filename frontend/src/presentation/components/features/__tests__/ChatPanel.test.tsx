export {};
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from '../ChatPanel';

vi.mock('../../../hooks/useChat', () => {
  return {
    useChat: (documentId: string) => ({
      messages: [
        { id: '1', type: 'question', text: '質問', timestamp: new Date() },
        { id: '2', type: 'answer', text: '回答', sources: [{ documentId: 'doc-1', pageNumber: 1 }], timestamp: new Date() },
      ],
      isLoading: false,
      error: null,
      submitQuestion: vi.fn(),
    }),
  };
});

describe('ChatPanel', () => {
  it('チャット履歴・入力欄が表示される', () => {
    render(<ChatPanel documentId="doc-1" />);
    expect(screen.getByText('ドキュメントQ&A')).toBeInTheDocument();
    expect(screen.getByText('質問')).toBeInTheDocument();
    expect(screen.getByText('回答')).toBeInTheDocument();
    expect(screen.getByText(/出典: doc-1/)).toBeInTheDocument();
    expect(screen.getByLabelText('質問入力')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });
});
