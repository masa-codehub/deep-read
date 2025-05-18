import { useState, useCallback } from 'react';
import { uploadPDFFile } from '../../infrastructure/services/api';
import { UploadStatus } from '../components/features/FileUpload/FileUploadModal';

/**
 * ファイルアップロードに関連する状態と処理をカプセル化するカスタムフック
 * 
 * @returns ファイルアップロードに関連する状態と関数
 */
export const useFileUpload = () => {
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

  // アップロード完了時のコールバック用ステート
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);

  /**
   * ファイル選択時の処理
   */
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setIsModalOpen(true);
    setUploadStatus('idle');
    setResultMessage('');
    setUploadProgress(0);
  }, []);

  /**
   * ファイルアップロード処理の開始
   */
  const handleUploadStart = useCallback(async () => {
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

      // ドキュメントIDがレスポンスに含まれていれば保存
      if (response.documentId) {
        setUploadedDocumentId(response.documentId);
      }
      
    } catch (error) {
      // エラーの場合はエラーメッセージを表示
      setUploadStatus('error');
      setResultMessage(error instanceof Error ? error.message : '不明なエラーが発生しました。');
    }
  }, [selectedFile]);

  /**
   * モーダルを閉じる処理
   */
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    
    // アップロード中でなければモーダルのステートをリセット
    if (uploadStatus !== 'uploading') {
      setUploadProgress(0);
      setResultMessage('');
      
      // アップロード成功後に閉じる場合、ファイル選択状態をリセット
      if (uploadStatus === 'success') {
        setSelectedFile(null);
      }
    }
  }, [uploadStatus]);

  /**
   * 状態をリセットする関数
   */
  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setIsModalOpen(false);
    setUploadStatus('idle');
    setUploadProgress(0);
    setResultMessage('');
    setUploadedDocumentId(null);
  }, []);

  return {
    selectedFile,
    isModalOpen,
    uploadStatus,
    uploadProgress,
    resultMessage,
    uploadedDocumentId,
    handleFileSelect,
    handleUploadStart,
    handleModalClose,
    resetUploadState
  };
};

export default useFileUpload;
