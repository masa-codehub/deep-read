import { useState, useEffect, useCallback } from 'react';
import { Document, getDocumentStatus } from '../services/api';

/**
 * 処理中のドキュメントのステータスをポーリングするカスタムフック
 * 
 * @param initialDocuments ポーリング対象となる初期ドキュメント一覧
 * @param pollingInterval ポーリング間隔（ミリ秒）
 * @returns 更新されたドキュメント一覧
 */
export const useDocumentStatusPolling = (
  initialDocuments: Document[],
  pollingInterval: number = process.env.NODE_ENV === 'test' ? 1000 : 4000
) => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);

  // ポーリング処理を行う関数
  const pollDocumentStatus = useCallback(async (docs: Document[]) => {
    const processingDocs = docs.filter(doc => doc.status === 'Processing');
    
    if (!processingDocs.length) {
      return docs; // 処理中のドキュメントがなければそのまま返す
    }
    
    try {
      let updatedDocs = [...docs]; // ドキュメント一覧のコピーを作成

      // 各処理中ドキュメントに対してステータス更新を実施
      for (const doc of processingDocs) {
        try {
          const update = await getDocumentStatus(doc.id);
          
          if (update) {
            updatedDocs = updatedDocs.map(d => {
              if (d.id === update.id) {
                // statusやprogressを更新
                const newDoc = { ...d };
                if (update.status !== undefined) newDoc.status = update.status;
                if (update.progress !== undefined) newDoc.progress = update.progress;
                return newDoc;
              }
              return d;
            });
          }
        } catch (error) {
          console.error(`ドキュメント ${doc.id} の更新中にエラーが発生しました:`, error);
          // エラーが出ても処理を続行
        }
      }
      
      setLastPolledAt(new Date());
      return updatedDocs;
    } catch (error) {
      console.error('ドキュメントステータスのポーリング中にエラーが発生しました:', error);
      return docs; // エラー時は元のドキュメント一覧を返す
    }
  }, []);

  // ドキュメント一覧の更新処理
  useEffect(() => {
    // initialDocumentsが空の場合は何もしない
    if (!initialDocuments.length) return;

    // 最新のドキュメント一覧を内部ステートに反映
    setDocuments(initialDocuments);

    // 処理中のドキュメントがあるかチェック
    const hasProcessingDocs = initialDocuments.some(doc => doc.status === 'Processing');
    
    if (!hasProcessingDocs) return;

    // ポーリング用タイマーとマウント状態の管理
    let timer: ReturnType<typeof setTimeout>;
    let mounted = true;

    // 非同期でステータス更新を実行する関数
    const updateDocumentStatus = async () => {
      if (!mounted) return;

      try {
        // 現在の最新ドキュメントを取得（クロージャを避けるため）
        // この修正により、古いdocuments値への依存を解消
        const currentDocs = initialDocuments;
        
        // ポーリング処理を実行し、更新されたドキュメント一覧を取得
        const updatedDocs = await pollDocumentStatus(currentDocs);
        
        if (!mounted) return;

        // 更新されたドキュメント一覧をセット
        setDocuments(updatedDocs);

        // まだ処理中のドキュメントがあるかチェック
        const stillHasProcessingDocs = updatedDocs.some(doc => doc.status === 'Processing');

        // 処理中のドキュメントが存在する場合、次回のポーリングをスケジュール
        if (mounted && stillHasProcessingDocs) {
          timer = setTimeout(updateDocumentStatus, pollingInterval);
        }
      } catch (error) {
        console.error('ドキュメントステータスの更新中にエラーが発生しました:', error);
        
        // エラーが発生しても、処理中のドキュメントがある限りポーリングを継続
        // currentDocsを使用して最新状態を取得
        if (mounted && initialDocuments.some(doc => doc.status === 'Processing')) {
          timer = setTimeout(updateDocumentStatus, pollingInterval);
        }
      }
    };

    // 最初のポーリングを遅延なく実行
    updateDocumentStatus();
    
    // クリーンアップ関数
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [initialDocuments, pollDocumentStatus, pollingInterval]);

  return { documents, lastPolledAt };
};

export default useDocumentStatusPolling;
