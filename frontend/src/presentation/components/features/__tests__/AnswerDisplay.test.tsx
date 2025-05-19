export {};
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnswerDisplay from '../AnswerDisplay';

describe('AnswerDisplay', () => {
  it('回答テキストが表示される', () => {
    render(<AnswerDisplay text="これは回答です" />);
    expect(screen.getByText('これは回答です')).toBeInTheDocument();
  });

  it('出典情報が1件表示される', () => {
    render(
      <AnswerDisplay
        text="回答"
        sources={[{ documentId: 'doc-1', pageNumber: 2, qaId: 'q-1', snippet: '抜粋' }]}
      />
    );
    expect(screen.getByText(/出典: doc-1/)).toBeInTheDocument();
    expect(screen.getByText(/p.2/)).toBeInTheDocument();
    expect(screen.getByText(/Q&A #q-1/)).toBeInTheDocument();
    expect(screen.getByText(/抜粋/)).toBeInTheDocument();
  });

  it('出典情報が複数表示される', () => {
    render(
      <AnswerDisplay
        text="回答"
        sources={[
          { documentId: 'doc-1', pageNumber: 1 },
          { documentId: 'doc-2', qaId: 'q-2' },
        ]}
      />
    );
    expect(screen.getAllByText(/出典:/).length).toBe(2);
  });

  it('出典情報がない場合は表示されない', () => {
    render(<AnswerDisplay text="回答" sources={[]} />);
    expect(screen.queryByText(/出典:/)).not.toBeInTheDocument();
  });
});
