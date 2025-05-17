import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LibraryView from './LibraryView';
import { Document } from '../services/api';
import useDocumentLibrary from '../hooks/useDocumentLibrary';
import useFileUpload from '../hooks/useFileUpload';
import useDocumentStatusPolling from '../hooks/useDocumentStatusPolling';

// テスト全体のタイムアウト設定を延長
jest.setTimeout(60000);

// カスタムフックをモック化
jest.mock('../hooks/useDocumentLibrary');
jest.mock('../hooks/useFileUpload');
jest.mock('../hooks/useDocumentStatusPolling');

// モックフックのタイプ定義
const mockUseDocumentLibrary = useDocumentLibrary as jest.MockedFunction<typeof useDocumentLibrary>;
const mockUseFileUpload = useFileUpload as jest.MockedFunction<typeof useFileUpload>;
const mockUseDocumentStatusPolling = useDocumentStatusPolling as jest.MockedFunction<typeof useDocumentStatusPolling>;

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
    progress: 50,
    thumbnailUrl: 'https://via.placeholder.com/150',
  },
];

describe('LibraryView', () => {
  beforeEach(() => {
    // 各テストの前にモックをリセット
    jest.clearAllMocks();
    
    // デフォルトのモック実装を設定
    mockUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: jest.fn(),
      retryFetchDocuments: jest.fn(),
      refreshDocuments: jest.fn(),
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: jest.fn(),
      pageSize: 10,
      updateDocuments: jest.fn(),
      updateDocumentProperty: jest.fn()
    });
    
    // useFileUploadのデフォルト実装
    mockUseFileUpload.mockReturnValue({
      selectedFile: null,
      isModalOpen: false,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: jest.fn(),
      handleUploadStart: jest.fn(),
      handleModalClose: jest.fn(),
      resetUploadState: jest.fn()
    });
    
    // useDocumentStatusPollingのデフォルト実装
    mockUseDocumentStatusPolling.mockReturnValue({
      documents: mockDocuments,
      lastPolledAt: null
    });
  });

  // 基本的なUIが正しくレンダリングされることをテスト
  test('renders library view with upload button', () => {
    render(<LibraryView />);
    expect(screen.getByText('ライブラリ')).toBeInTheDocument();
    expect(screen.getByTestId('pdf-upload-button')).toBeInTheDocument();
  });

  // ドキュメントが正しく表示されることをテスト
  test('renders documents in the library', async () => {
    // ポーリングで更新されたドキュメントを返すようにモックを設定
    mockUseDocumentStatusPolling.mockReturnValue({
      documents: mockDocuments,
      lastPolledAt: new Date()
    });
    
    render(<LibraryView />);
    
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
    mockUseDocumentLibrary.mockReturnValue({
      documents: [],
      isLoading: true,
      error: null,
      viewMode: 'list',
      setViewMode: jest.fn(),
      retryFetchDocuments: jest.fn(),
      refreshDocuments: jest.fn(),
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      changePage: jest.fn(),
      pageSize: 10,
      updateDocuments: jest.fn(),
      updateDocumentProperty: jest.fn()
    });
    
    render(<LibraryView />);
    
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
    mockUseDocumentLibrary.mockReturnValue({
      documents: [],
      isLoading: false,
      error: errorMessage,
      viewMode: 'list',
      setViewMode: jest.fn(),
      retryFetchDocuments: jest.fn(),
      refreshDocuments: jest.fn(),
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      changePage: jest.fn(),
      pageSize: 10,
      updateDocuments: jest.fn(),
      updateDocumentProperty: jest.fn()
    });
    
    render(<LibraryView />);
    
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
    const { retryFetchDocuments } = mockUseDocumentLibrary.mock.results[0].value;
    expect(retryFetchDocuments).toHaveBeenCalledTimes(1);
  });

  // ファイルアップロード処理のテスト
  test('handles file upload interaction correctly', async () => {
    // ファイル選択ハンドラーをモック
    const handleFileSelect = jest.fn();
    
    // handleFileSelectメソッドを持つモックを設定
    mockUseFileUpload.mockReturnValue({
      selectedFile: null,
      isModalOpen: false,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect,
      handleUploadStart: jest.fn(),
      handleModalClose: jest.fn(),
      resetUploadState: jest.fn()
    });
    
    render(<LibraryView />);
    
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
    mockUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'idle',
      uploadProgress: 0,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: jest.fn(),
      handleUploadStart: jest.fn(),
      handleModalClose: jest.fn(),
      resetUploadState: jest.fn()
    });
    
    render(<LibraryView />);
    
    // モーダルが表示されていることを確認
    const modal = screen.getByTestId('upload-modal');
    expect(modal).toBeInTheDocument();
    
    // ファイル名が表示されていることを確認
    expect(screen.getByTestId('upload-filename')).toHaveTextContent('test.pdf');
  });

  // アップロード進行中の表示をテスト
  test('shows upload progress in modal', () => {
    // アップロード中の状態を返すようにモック
    mockUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'uploading',
      uploadProgress: 65,
      resultMessage: '',
      uploadedDocumentId: null,
      handleFileSelect: jest.fn(),
      handleUploadStart: jest.fn(),
      handleModalClose: jest.fn(),
      resetUploadState: jest.fn()
    });
    
    render(<LibraryView />);
    
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
    mockUseFileUpload.mockReturnValue({
      selectedFile: createMockFile('test.pdf', 1024 * 1024, 'application/pdf'),
      isModalOpen: true,
      uploadStatus: 'success',
      uploadProgress: 100,
      resultMessage: 'アップロードに成功しました。解析処理を開始します。',
      uploadedDocumentId: 'new-doc-123',
      handleFileSelect: jest.fn(),
      handleUploadStart: jest.fn(),
      handleModalClose: jest.fn(),
      resetUploadState: jest.fn()
    });
    
    // refreshDocumentsメソッドのモック
    const refreshDocumentsMock = jest.fn();
    mockUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: jest.fn(),
      retryFetchDocuments: jest.fn(),
      refreshDocuments: refreshDocumentsMock,
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: jest.fn(),
      pageSize: 10,
      updateDocuments: jest.fn(),
      updateDocumentProperty: jest.fn()
    });
    
    render(<LibraryView />);
    
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
    const setViewModeMock = jest.fn();
    mockUseDocumentLibrary.mockReturnValue({
      documents: mockDocuments,
      isLoading: false,
      error: null,
      viewMode: 'list',
      setViewMode: setViewModeMock,
      retryFetchDocuments: jest.fn(),
      refreshDocuments: jest.fn(),
      totalCount: mockDocuments.length,
      currentPage: 1,
      totalPages: 1,
      changePage: jest.fn(),
      pageSize: 10,
      updateDocuments: jest.fn(),
      updateDocumentProperty: jest.fn()
    });
    
    render(<LibraryView />);
    
    // グリッド表示ボタンをクリック
    fireEvent.click(screen.getByTestId('grid-view-button'));
    
    // setViewModeが'grid'で呼ばれていることを確認
    expect(setViewModeMock).toHaveBeenCalledWith('grid');
  });
});
