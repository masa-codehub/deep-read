import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LibraryView from './LibraryView';
import { uploadPDFFile, getLibraryDocuments, Document } from '../services/api';

// APIをモック化
jest.mock('../services/api');
const mockUploadPDFFile = uploadPDFFile as jest.MockedFunction<typeof uploadPDFFile>;
const mockGetLibraryDocuments = getLibraryDocuments as jest.MockedFunction<typeof getLibraryDocuments>;

// モックファイルオブジェクトを作成するヘルパー関数
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

// Document型と一致するモックデータを作成
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Document 1',
    fileName: 'document_1.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Ready',
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    title: 'Document 2',
    fileName: 'document_2.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Processing',
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
];

describe('LibraryView', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
  });

  // 基本的なUIが正しくレンダリングされることをテスト
  test('renders library view with upload button', async () => {
    // APIレスポンスをモックし、空のドキュメントリストを返す
    mockGetLibraryDocuments.mockResolvedValue({
      documents: [],
      totalCount: 0,
      currentPage: 1,
      pageSize: 10, 
      totalPages: 1
    });
    
    render(<LibraryView />);
    
    // 非同期処理が完了するのを待つ
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ライブラリ/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /PDFファイルをアップロード/i })).toBeInTheDocument();
    });
    
    // ドキュメントが読み込まれたら、「アップロードされたドキュメントはありません」が表示されるはず
    await waitFor(() => {
      expect(screen.getByText('アップロードされたドキュメントはありません。')).toBeInTheDocument();
    });
  });

  // ファイル選択からアップロード完了までのフローをテスト
  test('handles file upload flow correctly', async () => {
    // アップロードAPIの成功時の挙動をモック
    mockUploadPDFFile.mockImplementation(async (file, onProgress) => {
      // 進捗コールバックをシミュレート（もし提供されていれば）
      if (onProgress) {
        onProgress(30);
        onProgress(60);
        onProgress(100);
      }
      
      return {
        success: true,
        message: 'ファイルのアップロードに成功しました。解析処理を開始します。',
        documentId: 'doc-123'
      };
    });
    
    render(<LibraryView />);
    
    // アップロードボタンをクリック
    const uploadButton = screen.getByRole('button', { name: /PDFファイルをアップロード/i });
    fireEvent.click(uploadButton);
    
    // ファイルが選択された状態をシミュレート
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = createMockFile('test-document.pdf', 1024 * 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    
    // モーダルが表示されることを確認
    expect(screen.getByText(/ファイルアップロード/i)).toBeInTheDocument();
    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    
    // アップロード開始ボタンをクリック
    const startUploadButton = screen.getByRole('button', { name: /アップロード開始/i });
    fireEvent.click(startUploadButton);
    
    // アップロード中の表示に変わることを確認
    expect(screen.getByText(/アップロード中/i)).toBeInTheDocument();
    
    // アップロード完了後の表示を確認
    await waitFor(() => {
      expect(screen.getByText(/アップロード完了/i)).toBeInTheDocument();
      expect(screen.getByText(/ファイルのアップロードに成功しました。解析処理を開始します。/i)).toBeInTheDocument();
    });
    
    // APIが正しく呼び出されたことを確認
    expect(mockUploadPDFFile).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'test-document.pdf'
      }),
      expect.any(Function)
    );
    
    // data-testidを使用してフッターの閉じるボタンを選択
    const closeButton = screen.getByTestId('footer-close-button');
    fireEvent.click(closeButton);
    
    // モーダルが閉じたことを確認
    expect(screen.queryByText(/アップロード完了/i)).not.toBeInTheDocument();
  });

  // アップロードエラー時の挙動をテスト
  test('handles upload error correctly', async () => {
    // アップロードAPIのエラー時の挙動をモック
    mockUploadPDFFile.mockRejectedValue(new Error('ファイルサイズが上限を超えています。'));
    
    render(<LibraryView />);
    
    // アップロードボタンをクリックしてファイルを選択
    const uploadButton = screen.getByRole('button', { name: /PDFファイルをアップロード/i });
    fireEvent.click(uploadButton);
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = createMockFile('large-file.pdf', 1024 * 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [testFile] } });
    
    // アップロード開始
    const startUploadButton = screen.getByRole('button', { name: /アップロード開始/i });
    fireEvent.click(startUploadButton);
    
    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/アップロードエラー/i)).toBeInTheDocument();
      expect(screen.getByText(/ファイルサイズが上限を超えています。/i)).toBeInTheDocument();
    });
  });
});

describe('LibraryView API integration', () => {
  it('renders documents from the API', async () => {
    // APIレスポンスをモックする
    mockGetLibraryDocuments.mockResolvedValue({
      documents: mockDocuments,
      totalCount: 2,
      currentPage: 1,
      pageSize: 10,
      totalPages: 1
    });

    render(<LibraryView />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Document 1')).toBeInTheDocument();
      expect(screen.getByText('Document 2')).toBeInTheDocument();
    });
  });

  it('shows an error message when the API call fails', async () => {
    // APIエラーをモックする
    mockGetLibraryDocuments.mockRejectedValue(new Error('不明なエラーが発生しました。'));

    render(<LibraryView />);

    await waitFor(() => {
      expect(screen.getByText('ドキュメントの読み込みに失敗しました。しばらくしてからもう一度お試しください。')).toBeInTheDocument();
    });
  });
});