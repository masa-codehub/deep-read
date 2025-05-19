import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageList from '../MessageList';
import type { ChatMessage } from '../../../../types/chat';

export {};

describe('MessageList', () => {
  const messages: ChatMessage[] = [
    {
      id: '1',
      type: 'question',
      text: '質問1',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'answer',
      text: '回答1',
      sources: [
        { documentId: 'doc-1', pageNumber: 1, snippet: '抜粋1' },
      ],
      timestamp: new Date(),
    },
  ];

  it('質問と回答がリスト表示される', () => {
    render(<MessageList messages={messages} />);
    expect(screen.getByText('質問1')).toBeInTheDocument();
    expect(screen.getByText('回答1')).toBeInTheDocument();
    expect(screen.getByText(/出典: doc-1/)).toBeInTheDocument();
  });

  it('メッセージが空ならスクロール用divのみ表示', () => {
    const { container } = render(<MessageList messages={[]} />);
    // div要素が2つだけ存在する（ラッパー＋スクロール用）
    const divs = container.querySelectorAll('div');
    expect(divs.length).toBe(2);
  });
});
