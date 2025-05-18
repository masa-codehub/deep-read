import React from 'react';
import { Document } from '../../../../infrastructure/services/api';
import './DocumentListItem.css';

interface DocumentListItemProps {
  document: Document;
}

/**
 * ステータス表示用のマッピングオブジェクト
 * APIのステータス値と表示文字列の対応付け
 */
const statusDisplayMap: Record<string, string> = {
  'Ready': '準備完了',
  'Processing': '処理中',
  'Error': 'エラー'
};

const DocumentListItem: React.FC<DocumentListItemProps> = ({ document }) => {
  const { title, fileName, updatedAt, status, thumbnailUrl, progress } = document;

  return (
    <div className="document-list-item" data-testid={`document-item-${document.id}`}>
      <img src={thumbnailUrl} alt={`${title} thumbnail`} className="thumbnail" />
      <div className="document-info">
        <h3 className="title" data-testid={`document-title-${document.id}`}>{title}</h3>
        <p className="file-name">{fileName}</p>
        <p className="updated-at">{new Date(updatedAt).toLocaleString()}</p>
        {/* ステータス表示・進捗インジケータ */}
        {status === 'Processing' ? (
          <div className="progress-indicator" data-testid={`progress-indicator-${document.id}`}>
            <p data-testid={`progress-text-${document.id}`}>
              {statusDisplayMap[status] || '処理中'}... {progress !== undefined ? `${progress.toFixed(0)}%` : '0%'}
            </p>
            <div className="item-progress-bar-container">
              <div 
                className="item-progress-bar" 
                style={{ width: `${progress !== undefined ? progress : 0}%` }}
                data-testid={`progress-bar-${document.id}`}
              ></div>
            </div>
          </div>
        ) : (
          <p 
            className={`status status-${status ? status.toLowerCase() : 'default'}`}
            data-testid={`status-${document.id}`}
          >
            {statusDisplayMap[status] || status || 'ステータス不明'}
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentListItem;
