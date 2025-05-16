import React, { useState, useEffect } from 'react';
import UploadButton from '../components/FileUpload/UploadButton';
import FileUploadModal from '../components/FileUpload/FileUploadModal';
import { UploadStatus } from '../components/FileUpload/FileUploadModal';
import { uploadPDFFile, getLibraryDocuments, Document } from '../services/api';
import DocumentList from '../components/DocumentList/DocumentList';
import './LibraryView.css';

/**
 * ライブラリ画面コンポーネント
 * PDFアップロード機能を含む
 */
const LibraryView: React.FC = () => {
  // 選択されたファイル
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // モーダルの状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // アップロード状態
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  
  // アップロード進捗（0-100%）
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 結果メッセージ
  const [resultMessage, setResultMessage] = useState('');

  // ドキュメント一覧の状態管理
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getLibraryDocuments();
        setDocuments(response.documents);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // ファイル選択時の処理
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setIsModalOpen(true);
    setUploadStatus('idle');
    setResultMessage('');
  };

  // ファイルアップロード処理の開始
  const handleUploadStart = async () => {
    if (!selectedFile) {
      setResultMessage('アップロードするファイルが選択されていません。');
      setUploadStatus('error');
      return;
    }

    try {
      // アップロード中の状態に更新
      setUploadStatus('uploading');
      setUploadProgress(0);

      // APIを呼び出してファイルをアップロード
      const response = await uploadPDFFile(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      // 成功したら成功メッセージを表示
      setUploadStatus('success');
      setResultMessage(response.message || 'ファイルのアップロードに成功しました。解析処理を開始します。');

      // 成功後の状態リセット（必要に応じて）
      setSelectedFile(null);
      
    } catch (error) {
      // エラーの場合はエラーメッセージを表示
      setUploadStatus('error');
      setResultMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    }
  };

  // モーダルを閉じる処理
  const handleModalClose = () => {
    setIsModalOpen(false);
    
    // アップロード中でなければモーダルのステートをリセット
    if (uploadStatus !== 'uploading') {
      setUploadProgress(0);
      setResultMessage('');
    }
  };

  return (
    <div className="library-view">
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
        {/* ライブラリのコンテンツ（ドキュメント一覧など）をここに表示 */}
        <div className="view-mode-toggle">
          <button
            onClick={() => setViewMode('list')}
            disabled={viewMode === 'list'}
          >
            リスト表示
          </button>
          <button
            onClick={() => setViewMode('grid')}
            disabled={viewMode === 'grid'}
          >
            グリッド表示
          </button>
        </div>
        <div className="library-documents">
          {isLoading && <p className="loading-message">読み込み中...</p>}
          {error && (
            <div className="error-container">
              <p className="error-message">ドキュメントの読み込みに失敗しました。しばらくしてからもう一度お試しください。</p>
              <p className="error-details">{error}</p>
              <button 
                className="retry-button"
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  // 再度APIを呼び出す
                  getLibraryDocuments()
                    .then(response => {
                      setDocuments(response.documents);
                      setIsLoading(false);
                    })
                    .catch(err => {
                      setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
                      setIsLoading(false);
                    });
                }}
              >
                再試行
              </button>
            </div>
          )}
          {!isLoading && !error && (
            <DocumentList documents={documents} viewMode={viewMode} />
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

export default LibraryView;