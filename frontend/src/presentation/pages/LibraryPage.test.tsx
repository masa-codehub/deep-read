import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi } from 'vitest';

import LibraryPage from './LibraryPage';
import { Document } from '../../types/document';
import useDocumentLibrary from '../hooks/useDocumentLibrary';
import useFileUpload from '../hooks/useFileUpload';
import useDocumentStatusPolling from '../hooks/useDocumentStatusPolling';

vi.mock('../hooks/useDocumentLibrary', () => ({ default: vi.fn() }));
vi.mock('../hooks/useFileUpload', () => ({ default: vi.fn() }));
vi.mock('../hooks/useDocumentStatusPolling', () => ({ default: vi.fn() }));

const mockedUseDocumentLibrary = useDocumentLibrary as unknown as ReturnType<typeof vi.fn>;
const mockedUseFileUpload = useFileUpload as unknown as ReturnType<typeof vi.fn>;
const mockedUseDocumentStatusPolling = useDocumentStatusPolling as unknown as ReturnType<typeof vi.fn>;

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
    status: 'READY',
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    title: 'Document 2',
    fileName: 'document_2.pdf',
    updatedAt: new Date().toISOString(),
    status: 'PROCESSING',
    progress: 50,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
];

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: vi.fn(),
      retryFetchDocuments: vi.fn(),
      refreshDocuments: vi.fn(),
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: vi.fn(),
      pageSize: 10,
      updateDocuments: vi.fn(),
      updateDocumentProperty: vi.fn()
    });
    mockedUseFileUpload.mockReturnValue({
      selectedFile: null,
      isModalOpen: false,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: vi.fn(),
      handleUploadStart: vi.fn(),
      handleModalClose: vi.fn(),
      resetUploadState: vi.fn()
    });
    mockedUseDocumentStatusPolling.mockReturnValue({
      documents: mockDocuments,
    });
  });

  // 基本的なUIが正しくレンダリングされることをテスト
  test('renders library view with upload button', () => {
    render(<LibraryPage />);
    expect(screen.getByText('ライブラリ')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-upload-button')).toBeInTheDocument();
  });

  // ドキュメントが正しく表示されることをテスト
  test('renders documents in the library', async () => {
    // ポーリングで更新されたドキュメントを返すようにモックを設定
    mockedUseDocumentStatusPolling.mockReturnValue({
      documents: mockDocuments,
    });
    
    render(<LibraryPage />);
    
    // ドキュメントタイトルが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByTestId('document-title-1')).toBeInTheDocument();
      expect(screen.getByTestId('document-title-2')).toBeInTheDocument();
    });
    
    // 1つ目のドキュメントが「準備完了」と表示されること
    expect(screen.getByTestId('status-1')).toHaveTextContent('準備完了');
    
    // 2つ目のドキュメントが「処理中...」と表示されること
    const processingEl = screen.getByTestId('progress-text-2');
    expect(processingEl).toBeInTheDocument();
    expect(processingEl.textContent).toContain('50%');
  });

  // ローディング状態のテスト
  test('shows loading state correctly', () => {
    // ローディング中の状態を返すようにモック
    mockedUseDocumentLibrary.mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      viewMode: 'list',
      setViewMode: vi.fn(),
      retryFetchDocuments: vi.fn(),
      refreshDocuments: vi.fn(),
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      changePage: vi.fn(),
      pageSize: 10,
      updateDocuments: vi.fn(),
      updateDocumentProperty: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // ローディングメッセージが表示されることを確認
    expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    expect(screen.getByTestId('loading-message')).toHaveTextContent('読み込み中...');
    
    // ドキュメントリストは表示されていないこと
    expect(screen.queryByTestId('document-list')).not.toBeInTheDocument();
  });

  // エラー状態のテスト
  test('shows error state correctly', () => {
    const errorMessage = 'APIエラーが発生しました';
    
    // エラーの状態を返すようにモック
    mockedUseDocumentLibrary.mockReturnValue({
      documents: [],
      isLoading: false,
      error: errorMessage,
      viewMode: 'list',
      setViewMode: vi.fn(),
      retryFetchDocuments: vi.fn(),
      refreshDocuments: vi.fn(),
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      changePage: vi.fn(),
      pageSize: 10,
      updateDocuments: vi.fn(),
      updateDocumentProperty: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // エラーメッセージが表示されることを確認
    const errorContainer = screen.getByTestId('error-container');
    expect(errorContainer).toBeInTheDocument();
    expect(screen.getByTestId('error-details')).toHaveTextContent(errorMessage);
    
    // 再試行ボタンが表示され、クリックできることを確認
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // 再試行ボタンをクリック
    fireEvent.click(retryButton);
    
    // retryFetchDocumentsメソッドが呼ばれていることを確認
    const { retryFetchDocuments } = mockedUseDocumentLibrary.mock.results[0].value;
    expect(retryFetchDocuments).toHaveBeenCalledTimes(1);
  });

  // ファイルアップロード処理のテスト
  test('handles file upload interaction correctly', async () => {
    // ファイル選択ハンドラーをモック
    const handleFileSelect = vi.fn();
    
    // handleFileSelectメソッドを持つモックを設定
    mockedUseFileUpload.mockReturnValue({
      selectedFile: null,
      isModalOpen: false,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect,
      handleUploadStart: vi.fn(),
      handleModalClose: vi.fn(),
      resetUploadState: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // ファイルアップロードボタンがレンダリングされていることを確認
    const uploadButton = screen.getByTestId('pdf-upload-button');
    expect(uploadButton).toBeInTheDocument();
    
    // テストファイルを作成
    const testFile = createMockFile('test.pdf', 1024 * 1024, 'application/pdf');
    
    // input要素を取得し、ファイル選択イベントを発火
    const fileInput = screen.getByTestId('file-input');
    
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [testFile] } });
    });
    
    // handleFileSelectメソッドがファイル引数で呼ばれたことを確認
    expect(handleFileSelect).toHaveBeenCalledWith(testFile);
  });

  // ファイルアップロードモーダルのテスト
  test('renders file upload modal when isModalOpen is true', () => {
    // モーダルが開いている状態を返すようにモック
    mockedUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: vi.fn(),
      handleUploadStart: vi.fn(),
      handleModalClose: vi.fn(),
      resetUploadState: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // モーダルが表示されていることを確認
    const modal = screen.getByTestId('upload-modal');
    expect(modal).toBeInTheDocument();
    
    // ファイル名が表示されていることを確認
    expect(screen.getByTestId('upload-filename')).toHaveTextContent('test.pdf');
  });

  // アップロード進行中の表示をテスト
  test('shows upload progress in modal', () => {
    // アップロード中の状態を返すようにモック
    mockedUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'uploading',
      uploadProgress: 65,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: vi.fn(),
      handleUploadStart: vi.fn(),
      handleModalClose: vi.fn(),
      resetUploadState: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // モーダルのタイトルがアップロード中になっていることを確認
    expect(screen.getByTestId('upload-modal-title')).toHaveTextContent('アップロード中...');
    
    // 進捗バーが表示されていて65%になっていることを確認
    const progressBar = screen.getByTestId('upload-progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(screen.getByTestId('upload-progress-text')).toHaveTextContent('65%');
  });

  // アップロード成功時の表示をテスト
  test('shows success message after successful upload', async () => {
    // 成功状態を返すようにモック
    mockedUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'success',
      uploadProgress: 100,
      resultMessage: 'アップロードに成功しました。解析処理を開始します。',
      uploadedDocumentId: 'new-doc-123',
      handleFileSelect: vi.fn(),
      handleUploadStart: vi.fn(),
      handleModalClose: vi.fn(),
      resetUploadState: vi.fn()
    });
    
    // refreshDocumentsメソッドのモック
    const refreshDocumentsMock = vi.fn();
    mockedUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: vi.fn(),
      retryFetchDocuments: vi.fn(),
      refreshDocuments: refreshDocumentsMock,
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: vi.fn(),
      pageSize: 10,
      updateDocuments: vi.fn(),
      updateDocumentProperty: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // モーダルのタイトルが完了になっていることを確認
    expect(screen.getByTestId('upload-modal-title')).toHaveTextContent('アップロード完了');
    
    // 成功メッセージが表示されていることを確認
    expect(screen.getByTestId('upload-message')).toHaveTextContent('アップロードに成功しました');
    
    // refreshDocumentsが呼ばれていることを確認（useEffect内で）
    await waitFor(() => {
      expect(refreshDocumentsMock).toHaveBeenCalled();
    });
  });

  // 表示モード切り替えのテスト
  test('allows switching between list and grid view modes', () => {
    // setViewModeメソッドのモック
    const setViewModeMock = vi.fn();
    mockedUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: setViewModeMock,
      retryFetchDocuments: vi.fn(),
      refreshDocuments: vi.fn(),
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: vi.fn(),
      pageSize: 10,
      updateDocuments: vi.fn(),
      updateDocumentProperty: vi.fn()
    });
    
    render(<LibraryPage />);
    
    // グリッド表示ボタンをクリック
    fireEvent.click(screen.getByTestId('grid-view-button'));
    
    // setViewModeが'grid'で呼ばれていることを確認
    expect(setViewModeMock).toHaveBeenCalledWith('grid');
  });
});
