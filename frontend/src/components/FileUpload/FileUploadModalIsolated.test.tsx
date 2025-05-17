import { render, screen } from '@testing-library/react';
import FileUploadModal from './FileUploadModal';

describe('FileUploadModal Basic Tests', () => {
  // モーダル表示のテスト
  test('renders the modal when isOpen is true', () => {
    render(
      <FileUploadModal
        isOpen={true}
        onClose={() => {}}
        status="idle"
        progress={0}
      />
    );
    
    // モーダルの存在確認
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    
    // アイドル状態ではファイルアップロードというタイトルが表示される
    const title = screen.getByText('ファイルアップロード');
    expect(title).toBeInTheDocument();
  });
  
  // モーダルが非表示のテスト
  test('does not render when isOpen is false', () => {
    render(
      <FileUploadModal
        isOpen={false}
        onClose={() => {}}
        status="idle"
        progress={0}
      />
    );
    
    // モーダルが非表示であることを確認
    const dialog = screen.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  });
  
  // アップロード中状態のテスト
  test('shows uploading state correctly', () => {
    render(
      <FileUploadModal
        isOpen={true}
        onClose={() => {}}
        status="uploading"
        progress={65}
        fileName="test.pdf"
      />
    );
    
    // アップロード中タイトルが表示されること
    const uploadingTitle = screen.getByText('アップロード中...');
    expect(uploadingTitle).toBeInTheDocument();
    
    // ファイル名が表示されること
    const fileName = screen.getByText('test.pdf');
    expect(fileName).toBeInTheDocument();
    
    // 進捗テキストが表示されること
    const progressText = screen.getByText('65%');
    expect(progressText).toBeInTheDocument();
  });
  
  // アップロード成功状態のテスト
  test('shows success state correctly', () => {
    render(
      <FileUploadModal
        isOpen={true}
        onClose={() => {}}
        status="success"
        progress={100}
        fileName="test.pdf"
        message="アップロードに成功しました！"
      />
    );
    
    // 成功タイトルが表示されること
    const successTitle = screen.getByText('アップロード完了');
    expect(successTitle).toBeInTheDocument();
    
    // メッセージが表示されること
    const message = screen.getByText('アップロードに成功しました！');
    expect(message).toBeInTheDocument();
  });
  
  // エラー状態のテスト
  test('shows error state correctly', () => {
    render(
      <FileUploadModal
        isOpen={true}
        onClose={() => {}}
        status="error"
        progress={0}
        fileName="test.pdf"
        message="ファイルサイズが上限を超えています。"
      />
    );
    
    // エラータイトルが表示されること
    const errorTitle = screen.getByText('アップロードエラー');
    expect(errorTitle).toBeInTheDocument();
    
    // エラーメッセージが表示されること
    const errorMessage = screen.getByText('ファイルサイズが上限を超えています。');
    expect(errorMessage).toBeInTheDocument();
  });
});
