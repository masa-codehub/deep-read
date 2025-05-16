import React from 'react';
import { Document } from '../../services/api';
import './DocumentListItem.css';

interface DocumentListItemProps {
  document: Document;
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({ document }) => {
  const { title, fileName, updatedAt, status, thumbnailUrl } = document;

  return (
    <div className="document-list-item">
      <img src={thumbnailUrl} alt={`${title} thumbnail`} className="thumbnail" />
      <div className="document-info">
        <h3 className="title">{title}</h3>
        <p className="file-name">{fileName}</p>
        <p className="updated-at">{new Date(updatedAt).toLocaleString()}</p>
        <p className={`status status-${status.toLowerCase()}`}>{status}</p>
      </div>
    </div>
  );
};

export default DocumentListItem;
