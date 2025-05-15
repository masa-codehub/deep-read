import React, { useState } from 'react';
import UploadButton from '../components/FileUpload/UploadButton';
import FileUploadModal from '../components/FileUpload/FileUploadModal';
import { UploadStatus } from '../components/FileUpload/FileUploadModal';
import { uploadPDFFile } from '../services/api';
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
        <div className="library-documents">
          {/* この部分は実際のプロジェクト要件に応じて実装 */}
          <p>ドキュメント一覧がここに表示されます</p>
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