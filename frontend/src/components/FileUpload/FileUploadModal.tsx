import React from 'react';
import './FileUpload.css';

/**
 * アップロードの状態を表す型
 */
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: UploadStatus;
  progress: number; // 0-100
  fileName?: string;
  message?: string;
  onUploadStart?: () => void; // アップロード開始ボタンのコールバック
}

/**
 * ファイルアップロードの進捗と結果を表示するモーダルコンポーネント
 * 
 * @param isOpen モーダルの表示状態
 * @param onClose モーダルを閉じる際のコールバック
 * @param status アップロードの状態
 * @param progress アップロードの進捗率（0-100）
 * @param fileName アップロード中のファイル名（オプション）
 * @param message 表示するメッセージ（成功やエラー情報など）
 * @param onUploadStart アップロード開始ボタンクリック時のコールバック（オプション）
 */
const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  status,
  progress,
  fileName = '',
  message = '',
  onUploadStart
}) => {
  if (!isOpen) return null;

  return (
    <div className="upload-modal-overlay" role="dialog" aria-labelledby="upload-modal-title">
      <div className="upload-modal">
        <div className="upload-modal-header">
          <h2 id="upload-modal-title">
            {status === 'idle' && 'ファイルアップロード'}
            {status === 'uploading' && 'アップロード中...'}
            {status === 'success' && 'アップロード完了'}
            {status === 'error' && 'アップロードエラー'}
          </h2>
          {/* モーダルを閉じる際に使用するアクセシブルな閉じるボタン */}
          <button 
            className="upload-modal-close" 
            onClick={onClose}
            aria-label="閉じる"
            disabled={status === 'uploading'}
          >
            ×
          </button>
        </div>
        
        <div className="upload-modal-body">
          {fileName && <p className="upload-filename">{fileName}</p>}
          
          {status === 'uploading' && (
            <div className="upload-progress-container">
              <div 
                className="upload-progress-bar" 
                style={{ width: `${progress}%` }} 
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
              <span className="upload-progress-text">{progress.toFixed(0)}%</span>
            </div>
          )}
          
          {message && (
            <p className={`upload-message ${status === 'error' ? 'upload-error-message' : ''}`}>
              {message}
            </p>
          )}
        </div>
        
        <div className="upload-modal-footer">
          {status === 'idle' && fileName && onUploadStart && (
            <button 
              className="upload-modal-button upload-start-button"
              onClick={onUploadStart}
            >
              アップロード開始
            </button>
          )}
          {status !== 'uploading' && (
            <button 
              className="upload-modal-button" 
              onClick={onClose}
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;