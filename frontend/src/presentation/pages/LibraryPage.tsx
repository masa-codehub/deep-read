import React, { useEffect } from 'react';
import UploadButton from '../components/features/FileUpload/UploadButton';
import FileUploadModal from '../components/features/FileUpload/FileUploadModal';
import DocumentList from '../components/features/DocumentList/DocumentList';
import useDocumentLibrary from '../hooks/useDocumentLibrary';
import useFileUpload from '../hooks/useFileUpload';
import useDocumentStatusPolling from '../hooks/useDocumentStatusPolling';
import './LibraryPage.css';

/**
 * ライブラリ画面コンポーネント
 * PDFアップロード機能を含む
 */
const LibraryPage: React.FC = () => {
  // カスタムフックを使用してドキュメント一覧機能を統合
  const {
    documents,
    isLoading,
    error,
    viewMode,
    setViewMode,
    retryFetchDocuments,
    refreshDocuments
  } = useDocumentLibrary();

  // カスタムフックを使用してファイルアップロード機能を統合
  const {
    selectedFile,
    isModalOpen,
    uploadStatus,
    uploadProgress,
    resultMessage,
    handleFileSelect,
    handleUploadStart,
    handleModalClose
  } = useFileUpload();

  // ドキュメントステータスのポーリング処理を統合
  const { documents: updatedDocuments } = useDocumentStatusPolling(documents);

  // アップロード成功時は一覧を再取得
  useEffect(() => {
    if (uploadStatus === 'success') {
      refreshDocuments();
    }
  }, [uploadStatus, refreshDocuments]);

  return (
    <div className="library-page" data-testid="library-view-container">
      <header className="library-header">
        <h1>ライブラリ</h1>
        <div className="library-actions">
          <UploadButton 
            onFileSelect={handleFileSelect} 
            disabled={uploadStatus === 'uploading'} 
          />
        </div>
      </header>

      <main className="library-content">
        {/* 表示モード切替 */}
        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode('list')}
            disabled={viewMode === 'list'}
            data-testid="list-view-button"
          >
            リスト表示
          </button>
          <button
            onClick={() => setViewMode('grid')}
            disabled={viewMode === 'grid'}
            data-testid="grid-view-button"
          >
            グリッド表示
          </button>
        </div>

        {/* ライブラリのコンテンツ（ドキュメント一覧など） */}
        <div className="library-documents" data-testid="document-container">
          {isLoading && <p className="loading-message" data-testid="loading-message">読み込み中...</p>}
          
          {error && (
            <div className="error-container" data-testid="error-container">
              <p className="error-message">ドキュメントの読み込みに失敗しました。しばらくしてからもう一度お試しください。</p>
              <p className="error-details" data-testid="error-details">{error}</p>
              <button 
                className="retry-button"
                data-testid="retry-button"
                onClick={retryFetchDocuments}
              >
                再試行
              </button>
            </div>
          )}
          
          {!isLoading && !error && (
            <DocumentList documents={updatedDocuments || documents} viewMode={viewMode} />
          )}
        </div>
      </main>

      {/* ファイルアップロードモーダル */}
      <FileUploadModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        status={uploadStatus}
        progress={uploadProgress}
        fileName={selectedFile?.name}
        message={resultMessage}
        onUploadStart={handleUploadStart}
      />
    </div>
  );
};

export default LibraryPage;