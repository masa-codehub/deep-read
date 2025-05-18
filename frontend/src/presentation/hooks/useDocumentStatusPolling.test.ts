import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useDocumentStatusPolling, PolledDocumentStatus } from './useDocumentStatusPolling';
import { getDocumentStatuses } from '../../infrastructure/services/api';

vi.mock('../../infrastructure/services/api');
const mockGetDocumentStatuses = vi.mocked(getDocumentStatuses);

describe('useDocumentStatusPolling (new API)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('ポーリングでonStatusUpdateが呼ばれる', async () => {
    mockGetDocumentStatuses
      .mockImplementationOnce(async () => [
        { id: 'doc1', status: 'PROCESSING', progress: 50 },
        { id: 'doc2', status: 'PROCESSING', progress: 10 },
      ])
      .mockImplementationOnce(async () => [
        { id: 'doc1', status: 'READY', progress: 100 },
        { id: 'doc2', status: 'PROCESSING', progress: 50 },
      ]);
    const onStatusUpdate = vi.fn();
    renderHook(() => useDocumentStatusPolling({
      documentIdsToPoll: ['doc1', 'doc2'],
      onStatusUpdate,
      pollingInterval: 10,
      enabled: true,
    }));
    // 1回目
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).toHaveBeenCalledWith([
      { id: 'doc1', status: 'PROCESSING', progress: 50, error_message: undefined },
      { id: 'doc2', status: 'PROCESSING', progress: 10, error_message: undefined },
    ]);
    // 2回目
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).toHaveBeenCalledWith([
      { id: 'doc1', status: 'READY', progress: 100, error_message: undefined },
      { id: 'doc2', status: 'PROCESSING', progress: 50, error_message: undefined },
    ]);
    expect(mockGetDocumentStatuses.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('enabled=false でポーリングされない', async () => {
    const onStatusUpdate = vi.fn();
    renderHook(() => useDocumentStatusPolling({
      documentIdsToPoll: ['doc1'],
      onStatusUpdate,
      pollingInterval: 10,
      enabled: false,
    }));
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).not.toHaveBeenCalled();
    expect(mockGetDocumentStatuses).not.toHaveBeenCalled();
  });

  it('documentIdsToPollが空なら何もしない', async () => {
    const onStatusUpdate = vi.fn();
    renderHook(() => useDocumentStatusPolling({
      documentIdsToPoll: [],
      onStatusUpdate,
      pollingInterval: 10,
      enabled: true,
    }));
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).not.toHaveBeenCalled();
    expect(mockGetDocumentStatuses).not.toHaveBeenCalled();
  });

  it('APIエラーが発生してもポーリングは継続する', async () => {
    mockGetDocumentStatuses
      .mockImplementationOnce(async () => { throw new Error('API error'); })
      .mockImplementationOnce(async () => [
        { id: 'doc1', status: 'PROCESSING', progress: 60 },
      ]);
    const onStatusUpdate = vi.fn();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useDocumentStatusPolling({
      documentIdsToPoll: ['doc1'],
      onStatusUpdate,
      pollingInterval: 10,
      enabled: true,
    }));
    // 1回目（エラー）
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    // 2回目（成功）
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).toHaveBeenCalledTimes(1);
    expect(mockGetDocumentStatuses.mock.calls.length).toBeGreaterThanOrEqual(2);
    consoleErrorSpy.mockRestore();
  });

  it('props変更で新しいIDリストに切り替わる', async () => {
    mockGetDocumentStatuses.mockImplementation(async (ids: string[]) => ids.map(id => ({ id, status: 'PROCESSING', progress: 42 })));
    const onStatusUpdate = vi.fn();
    const { rerender } = renderHook(
      (props) => useDocumentStatusPolling(props),
      {
        initialProps: {
          documentIdsToPoll: ['doc1'],
          onStatusUpdate,
          pollingInterval: 10,
          enabled: true,
        }
      }
    );
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).toHaveBeenCalledWith([
      { id: 'doc1', status: 'PROCESSING', progress: 42, error_message: undefined },
    ]);
    rerender({
      documentIdsToPoll: ['doc2'],
      onStatusUpdate,
      pollingInterval: 10,
      enabled: true,
    });
    await act(async () => { vi.runOnlyPendingTimers(); await Promise.resolve(); });
    expect(onStatusUpdate).toHaveBeenCalledWith([
      { id: 'doc2', status: 'PROCESSING', progress: 42, error_message: undefined },
    ]);
  });
});
