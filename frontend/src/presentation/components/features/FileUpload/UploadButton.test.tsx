import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UploadButton from './UploadButton';

// モックファイルオブジェクトを作成するヘルパー関数
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('UploadButton', () => {
  // ボタンが正常にレンダリングされることをテスト
  test('renders upload button correctly', () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadButton onFileSelect={mockOnFileSelect} />);
    
    const button = screen.getByRole('button', { name: /PDFファイルをアップロード/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  // ボタンがdisabled状態のときのテスト
  test('button is disabled when disabled prop is true', () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadButton onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /PDFファイルをアップロード/i });
    expect(button).toBeDisabled();
  });

  // 有効なPDFファイルが選択された場合のテスト
  test('calls onFileSelect when valid PDF file is selected', () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadButton onFileSelect={mockOnFileSelect} />);
    
    // ファイル入力要素を取得
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // 有効なPDFファイルを作成
    const validPDFFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');
    
    // ファイル選択イベントをトリガー
    fireEvent.change(fileInput, { target: { files: [validPDFFile] } });
    
    // onFileSelectが呼び出されたことを確認
    expect(mockOnFileSelect).toHaveBeenCalledWith(validPDFFile);
  });

  // 無効なファイル形式が選択された場合のテスト
  test('shows error message when non-PDF file is selected', () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadButton onFileSelect={mockOnFileSelect} />);
    
    // ファイル入力要素を取得
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // 無効なファイル（テキストファイル）を作成
    const invalidFile = createMockFile('test.txt', 1024, 'text/plain');
    
    // ファイル選択イベントをトリガー
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    // エラーメッセージが表示され、onFileSelectが呼び出されないことを確認
    expect(screen.getByText(/PDFファイルのみアップロード可能です/i)).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  // ファイルサイズが上限を超える場合のテスト
  test('shows error message when file size exceeds limit', () => {
    const mockOnFileSelect = vi.fn();
    render(<UploadButton onFileSelect={mockOnFileSelect} />);
    
    // ファイル入力要素を取得
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // サイズが上限（100MB）を超えるファイルを作成
    const largeFile = createMockFile('large.pdf', 150 * 1024 * 1024, 'application/pdf');
    
    // ファイル選択イベントをトリガー
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    // エラーメッセージが表示され、onFileSelectが呼び出されないことを確認
    expect(screen.getByText(/ファイルサイズが上限.*を超えています/i)).toBeInTheDocument();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });
});