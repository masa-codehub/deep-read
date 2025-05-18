import { render, screen } from '@testing-library/react';
import DocumentList from './DocumentList';
import { Document } from '../../../../types/document';

describe('DocumentList', () => {
  const mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Document 1',
      fileName: 'document_1.pdf',
      updatedAt: new Date().toISOString(),
      status: 'READY',
      thumbnailUrl: 'https://via.placeholder.com/150',
    },
    {
      id: '2',
      title: 'Document 2',
      fileName: 'document_2.pdf',
      updatedAt: new Date().toISOString(),
      status: 'PROCESSING',
      thumbnailUrl: 'https://via.placeholder.com/150',
    },
  ];

  it('renders a list of documents', () => {
    render(<DocumentList documents={mockDocuments} viewMode="list" />);

    expect(screen.getByText('Document 1')).toBeInTheDocument();
    expect(screen.getByText('Document 2')).toBeInTheDocument();
  });

  it('shows a message when no documents are available', () => {
    render(<DocumentList documents={[]} viewMode="list" />);

    expect(screen.getByText('アップロードされたドキュメントはありません。')).toBeInTheDocument();
  });
});
