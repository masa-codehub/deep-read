export {};

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestionInput from '../QuestionInput';

// QuestionInput 単体テスト

describe('QuestionInput', () => {
  it('テキスト入力ができる', () => {
    const handleSubmit = vi.fn();
    render(<QuestionInput onSubmit={handleSubmit} />);
    const textarea = screen.getByLabelText('質問入力');
    fireEvent.change(textarea, { target: { value: 'テスト質問' } });
    expect((textarea as HTMLTextAreaElement).value).toBe('テスト質問');
  });

  it('送信ボタンが入力時のみ活性化される', () => {
    const handleSubmit = vi.fn();
    render(<QuestionInput onSubmit={handleSubmit} />);
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toBeDisabled();
    const textarea = screen.getByLabelText('質問入力');
    fireEvent.change(textarea, { target: { value: '質問' } });
    expect(button).not.toBeDisabled();
  });

  it('送信ボタンクリックでonSubmitが呼ばれ、入力がクリアされる', () => {
    const handleSubmit = vi.fn();
    render(<QuestionInput onSubmit={handleSubmit} />);
    const textarea = screen.getByLabelText('質問入力');
    const button = screen.getByRole('button', { name: '送信' });
    fireEvent.change(textarea, { target: { value: '質問テスト' } });
    fireEvent.click(button);
    expect(handleSubmit).toHaveBeenCalledWith('質問テスト');
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('Enterキーで送信される', () => {
    const handleSubmit = vi.fn();
    render(<QuestionInput onSubmit={handleSubmit} />);
    const textarea = screen.getByLabelText('質問入力');
    fireEvent.change(textarea, { target: { value: 'エンター送信' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(handleSubmit).toHaveBeenCalledWith('エンター送信');
  });

  it('disabled時は入力・送信不可', () => {
    const handleSubmit = vi.fn();
    render(<QuestionInput onSubmit={handleSubmit} disabled />);
    const textarea = screen.getByLabelText('質問入力');
    const button = screen.getByRole('button', { name: '送信' });
    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
  });
});
