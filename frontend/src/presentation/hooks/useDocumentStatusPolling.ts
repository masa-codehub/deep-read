import { useEffect, useCallback, useRef } from 'react';
import type { DocumentStatusOutputData } from '../../types/document';
import { getDocumentStatuses } from '../../infrastructure/services/api';

export type PolledDocumentStatus = Pick<DocumentStatusOutputData, 'id' | 'status' | 'progress' | 'error_message'>;

interface UseDocumentStatusPollingOptions {
  documentIdsToPoll: string[];
  onStatusUpdate: (updatedStatuses: PolledDocumentStatus[]) => void;
  pollingInterval?: number;
  enabled?: boolean;
}

/**
 * 指定されたドキュメントIDリストのステータスをポーリングし、
 * 更新があった場合にコールバック経由で通知するフック。
 * このフック自体はドキュメントリストの状態を管理せず、更新通知に特化する。
 */
export const useDocumentStatusPolling = ({
  documentIdsToPoll,
  onStatusUpdate,
  pollingInterval = 4000,
  enabled = true,
}: UseDocumentStatusPollingOptions) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onStatusUpdateRef = useRef(onStatusUpdate);

  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate;
  }, [onStatusUpdate]);

  const performPoll = useCallback(async () => {
    if (!documentIdsToPoll || documentIdsToPoll.length === 0) {
      return;
    }
    try {
      const statusResults = await getDocumentStatuses(documentIdsToPoll);
      if (Array.isArray(statusResults) && statusResults.length > 0) {
        onStatusUpdateRef.current(statusResults.map(s => ({
          id: s.id,
          status: s.status,
          progress: s.progress,
          error_message: s.error_message,
        })));
      }
    } catch (error) {
      // エラー時の通知も必要ならここでコールバック
      // onStatusUpdateRef.current([])
      // もしくは onError コールバック追加も検討
    }
  }, [documentIdsToPoll]);

  useEffect(() => {
    if (!enabled || !documentIdsToPoll || documentIdsToPoll.length === 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    let mounted = true;
    const scheduleNextPoll = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(async () => {
        if (mounted) {
          await performPoll();
          if (mounted && documentIdsToPoll.length > 0 && enabled) {
            scheduleNextPoll();
          }
        }
      }, pollingInterval);
    };
    performPoll();
    scheduleNextPoll();
    return () => {
      mounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [documentIdsToPoll, pollingInterval, performPoll, enabled]);
};

export default useDocumentStatusPolling;
