import React from 'react';
import { render, screen } from '@testing-library/react';
import DocumentListItem from './DocumentListItem';
import { Document } from '../../services/api';

describe('DocumentListItem', () => {
  const mockDocument: Document = {
    id: '1',
    title: 'Test Document',
    fileName: 'test_document.pdf',
    updatedAt: new Date().toISOString(),
    status: 'Ready',
    thumbnailUrl: 'https://via.placeholder.com/150',
  };

  it('renders document details correctly', () => {
    render(<DocumentListItem document={mockDocument} />);

    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('test_document.pdf')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByAltText('Test Document thumbnail')).toBeInTheDocument();
  });
});
