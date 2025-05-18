import React from 'react';
import DocumentListItem from './DocumentListItem';
import { Document } from '../../../../types/document';
import './DocumentList.css';

interface DocumentListProps {
  documents: Document[];
  viewMode: 'list' | 'grid';
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, viewMode }) => {
  if (documents.length === 0) {
    return <p>アップロードされたドキュメントはありません。</p>;
  }

  return (
    <div className={`document-list ${viewMode}`}>
      {documents.map((doc) => (
        <DocumentListItem key={doc.id} document={doc} />
      ))}
    </div>
  );
};

export default DocumentList;
