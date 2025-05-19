import React, { useEffect, useState } from 'react';
import UploadButton from '../components/features/FileUpload/UploadButton';
import FileUploadModal from '../components/features/FileUpload/FileUploadModal';
import DocumentList from '../components/features/DocumentList/DocumentList';
import useDocumentLibrary from '../hooks/useDocumentLibrary';
import useFileUpload from '../hooks/useFileUpload';
import ChatPanel from '../components/features/ChatPanel';
import { SearchBar } from '../components/features/Search/SearchBar';
import { useLibrarySearch } from '../hooks/useLibrarySearch';
import NoSearchResultsMessage from './NoSearchResultsMessage';
import useDocumentStatusPolling from '../hooks/useDocumentStatusPolling'; // issue#12_01 から
import './LibraryPage.css';
import './NoSearchResultsMessage.css';

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

  // ライブラリ検索機能のカスタムフック
  const {
    searchTerm,
    setSearchTerm,
    searchResults,
    isLoading: isSearchLoading,
    error: searchError,
  } = useLibrarySearch();

  // ドキュメントステータスのポーリング処理を統合 (issue#12_01 から)
  // ポリング対象のドキュメントリストは、検索結果がない場合は元のドキュメントリスト、検索結果がある場合は検索結果リストとする
  const documentsForPolling = searchTerm ? searchResults : documents;
  const { documents: updatedDocuments } = useDocumentStatusPolling(documentsForPolling);

  // 選択されたドキュメントIDの状態
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // アップロード成功時は一覧を再取得
  useEffect(() => {
    if (uploadStatus === 'success') {
      refreshDocuments();
    }
  }, [uploadStatus, refreshDocuments]);

  // 検索キーワードがクリアされたら選択ドキュメントもクリア
  useEffect(() => {
    if (!searchTerm) {
      setSelectedDocumentId(null);
    }
  }, [searchTerm]);

  // 表示するドキュメントリストを決定
  // 検索中であれば検索結果、そうでなければポーリングで更新されたドキュメント（または元のドキュメント）
  const displayDocuments = searchTerm ? searchResults : (updatedDocuments || documents);

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
        <div className="library-search-area">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            isLoading={isSearchLoading}
            onClear={() => setSearchTerm('')}
            placeholder="キーワードで検索"
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
          {(isSearchLoading || isLoading) && <p className="loading-message" data-testid="loading-message">読み込み中...</p>}
          {(searchError || error) && (
            <div className="error-container" data-testid="error-container">
              <p className="error-message">{searchError ? '検索に失敗しました。' : 'ドキュメントの読み込みに失敗しました。しばらくしてからもう一度お試しください。'}</p>
              <p className="error-details" data-testid="error-details">{searchError || error}</p>
              {!searchError && error && ( // 通常のドキュメント読み込みエラーの場合のみ再試行ボタンを表示
                <button
                  className="retry-button"
                  data-testid="retry-button"
                  onClick={retryFetchDocuments}
                >
                  再試行
                </button>
              )}
            </div>
          )}
          {!isSearchLoading && !searchError && !isLoading && !error && (
            <>
              <DocumentList
                documents={displayDocuments}
                viewMode={viewMode}
                onDocumentSelect={setSelectedDocumentId}
              />
              {searchTerm && searchResults.length === 0 && !isSearchLoading && (
                <NoSearchResultsMessage />
              )}
              {selectedDocumentId && (
                <div style={{ marginTop: 24 }}>
                  <ChatPanel documentId={selectedDocumentId} />
                </div>
              )}
            </>
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