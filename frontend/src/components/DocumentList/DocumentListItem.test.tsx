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
    expect(screen.getByText('準備完了')).toBeInTheDocument(); // 'Ready'から'準備完了'に変更
    expect(screen.getByAltText('Test Document thumbnail')).toBeInTheDocument();
  });

  it('renders processing status and progress bar', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Processing',
        progress: 45,
      }} />
    );
    expect(screen.getByText(/処理中/)).toBeInTheDocument();
    expect(screen.getByText('処理中... 45%')).toBeInTheDocument();
    // プログレスバーの幅が45%であること
    const bar = document.querySelector('.item-progress-bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('45%');
  });

  it('renders processing status with no progress value', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Processing',
        // progress値は明示的に未定義
      }} />
    );
    // statusDisplayMap['Processing'] を使うように変更
    expect(screen.getByTestId(`progress-text-${mockDocument.id}`)).toHaveTextContent('処理中... 0%');
    // プログレスバーの幅も0%であることを確認
    const bar = screen.getByTestId(`progress-bar-${mockDocument.id}`) as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('0%');
  });

  it('renders document with zero progress correctly', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Processing',
        progress: 0,
      }} />
    );
    expect(screen.getByText('処理中... 0%')).toBeInTheDocument();
    const bar = document.querySelector('.item-progress-bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('0%');
  });

  it('renders document with 100% progress correctly', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Processing',
        progress: 100,
      }} />
    );
    expect(screen.getByText('処理中... 100%')).toBeInTheDocument();
    const bar = document.querySelector('.item-progress-bar') as HTMLElement;
    expect(bar).toBeTruthy();
    expect(bar.style.width).toBe('100%');
  });

  it('renders ready status', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Ready',
      }} />
    );
    expect(screen.getByText('準備完了')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(
      <DocumentListItem document={{
        ...mockDocument,
        status: 'Error',
      }} />
    );
    expect(screen.getByText('エラー')).toBeInTheDocument();
  });
});
