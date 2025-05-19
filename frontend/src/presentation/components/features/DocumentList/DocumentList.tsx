import React from 'react';
import DocumentListItem from './DocumentListItem';
import { Document } from '../../../../types/document';
import './DocumentList.css';

interface DocumentListProps {
  documents: Document[];
  viewMode: 'list' | 'grid';
  onDocumentSelect?: (documentId: string) => void; // 追加
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, viewMode, onDocumentSelect }) => {
  if (documents.length === 0) {
    return <p>アップロードされたドキュメントはありません。</p>;
  }

  return (
    <div className={`document-list ${viewMode}`}>
      {documents.map((doc) => (
        <div key={doc.id} onClick={() => onDocumentSelect?.(doc.id)} style={{ cursor: onDocumentSelect ? 'pointer' : undefined }}>
          <DocumentListItem document={doc} />
        </div>
      ))}
    </div>
  );
};

export default DocumentList;
