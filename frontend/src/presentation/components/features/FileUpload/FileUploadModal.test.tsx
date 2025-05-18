import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import FileUploadModal, { UploadStatus } from './FileUploadModal';

describe('FileUploadModal', () => {
  // モーダルが閉じている場合、何も表示されないことをテスト
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <FileUploadModal 
        isOpen={false}
        onClose={() => {}}
        status="idle"
        progress={0}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  // 待機状態のモーダルが正しく表示されることをテスト
  test('renders idle state correctly', () => {
    render(
      <FileUploadModal 
        isOpen={true}
        onClose={() => {}}
        status="idle"
        progress={0}
        fileName="test.pdf"
      />
    );
    
    expect(screen.getByText('ファイルアップロード')).toBeInTheDocument();
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    
    // data-testidを使用してフッターの閉じるボタンを直接選択
    const footerCloseButton = screen.getByTestId('footer-close-button');
    expect(footerCloseButton).toBeInTheDocument();
  });

  // アップロード中の状態が正しく表示されることをテスト
  test('renders uploading state with progress bar', () => {
    render(
      <FileUploadModal 
        isOpen={true}
        onClose={() => {}}
        status="uploading"
        progress={45}
        fileName="uploading.pdf"
      />
    );
    
    expect(screen.getByText('アップロード中...')).toBeInTheDocument();
    expect(screen.getByText('uploading.pdf')).toBeInTheDocument();
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    
    expect(screen.getByText('45%')).toBeInTheDocument();
    
    // アップロード中はフッターの閉じるボタンが表示されないことを確認
    const headerCloseButton = screen.getByTestId('header-close-button');
    expect(headerCloseButton).toBeInTheDocument();
    expect(headerCloseButton).toBeDisabled();
    // フッターの閉じるボタンは存在しないはず
    expect(screen.queryByTestId('footer-close-button')).not.toBeInTheDocument();
  });

  // 成功状態が正しく表示されることをテスト
  test('renders success state with message', () => {
    render(
      <FileUploadModal 
        isOpen={true}
        onClose={() => {}}
        status="success"
        progress={100}
        fileName="success.pdf"
        message="ファイルのアップロードに成功しました。解析処理を開始します。"
      />
    );
    
    expect(screen.getByText('アップロード完了')).toBeInTheDocument();
    expect(screen.getByText('success.pdf')).toBeInTheDocument();
    expect(screen.getByText('ファイルのアップロードに成功しました。解析処理を開始します。')).toBeInTheDocument();
    
    // data-testidを使用して成功時のフッターの閉じるボタンを直接選択
    const footerCloseButton = screen.getByTestId('footer-close-button');
    expect(footerCloseButton).toBeInTheDocument();
  });

  // エラー状態が正しく表示されることをテスト
  test('renders error state with error message', () => {
    render(
      <FileUploadModal 
        isOpen={true}
        onClose={() => {}}
        status="error"
        progress={0}
        fileName="error.pdf"
        message="ファイルサイズが上限を超えています。"
      />
    );
    
    expect(screen.getByText('アップロードエラー')).toBeInTheDocument();
    expect(screen.getByText('error.pdf')).toBeInTheDocument();
    
    const errorMessage = screen.getByText('ファイルサイズが上限を超えています。');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.className).toContain('upload-error-message');
    
    // data-testidを使用してエラー時のフッターの閉じるボタンを直接選択
    const footerCloseButton = screen.getByTestId('footer-close-button');
    expect(footerCloseButton).toBeInTheDocument();
  });

  // 閉じるボタンをクリックするとonCloseが呼ばれることをテスト
  test('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    
    render(
      <FileUploadModal 
        isOpen={true}
        onClose={mockOnClose}
        status="success"
        progress={100}
      />
    );
    
    // data-testidを使用してフッターの閉じるボタンを直接選択してクリック
    const footerCloseButton = screen.getByTestId('footer-close-button');
    fireEvent.click(footerCloseButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});