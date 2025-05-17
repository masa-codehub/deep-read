import React, { useRef, useState } from 'react';
import './FileUpload.css';

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * PDFファイル選択のためのボタンコンポーネント
 * 
 * @param onFileSelect 選択されたファイルを処理するコールバック関数
 * @param disabled ボタンの無効状態（オプション）
 * @param className 追加のCSSクラス（オプション）
 */
const UploadButton: React.FC<UploadButtonProps> = ({ 
  onFileSelect, 
  disabled = false, 
  className = '' 
}) => {
  // ファイル入力要素への参照
  const fileInputRef = useRef<HTMLInputElement>(null);
  // エラーメッセージの状態
  const [error, setError] = useState<string | null>(null);

  // ファイル選択ダイアログを開く
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
      setError(null);
    }
  };

  // ファイル選択時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      // ファイルが選択されなかった場合
      return;
    }

    const file = files[0];

    // ファイルの拡張子をチェック
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'pdf') {
      setError('PDFファイルのみアップロード可能です。');
      // 入力値をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // ファイルサイズの上限をチェック（仮に100MB = 104857600バイトとする）
    const MAX_FILE_SIZE = 104857600;
    if (file.size > MAX_FILE_SIZE) {
      setError(`ファイルサイズが上限（${MAX_FILE_SIZE / 1024 / 1024}MB）を超えています。`);
      // 入力値をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // バリデーションに問題がなければ親コンポーネントにファイルを渡す
    setError(null);
    onFileSelect(file);
  };

  return (
    <div data-testid="upload-button-container">
      <button 
        onClick={handleClick}
        disabled={disabled}
        className={`upload-button ${className}`}
        aria-label="PDFファイルをアップロード"
        data-testid="pdf-upload-button"
      >
        PDFをアップロード
      </button>
      
      {/* 非表示のファイル入力要素 */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        style={{ display: 'none' }}
        aria-hidden="true"
        data-testid="file-input"
      />
      
      {/* エラーメッセージの表示 */}
      {error && <p className="upload-error" role="alert" data-testid="upload-error">{error}</p>}
    </div>
  );
};

export default UploadButton;