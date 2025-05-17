import { handlers } from './handlers';

describe('Handlers for MSW', () => {
  // ハンドラーの正しい構造とエンドポイント定義をテスト
  it('should have handler for document upload endpoint', () => {
    // handlersから特定のAPIパスと一致するハンドラを探す
    const uploadHandler = handlers.find(
      (handler) => handler.info.path === '/api/documents/upload/' && 
                  handler.info.method === 'POST'
    );
    expect(uploadHandler).toBeDefined();
  });

  it('should have handler for document list endpoint', () => {
    const listHandler = handlers.find(
      (handler) => handler.info.path === '/api/library/documents' &&
                  handler.info.method === 'GET'
    );
    expect(listHandler).toBeDefined();
  });

  it('should have handler for document status endpoint', () => {
    const statusHandler = handlers.find(
      (handler) => handler.info.path === '/api/documents/:documentId/status' && 
                  handler.info.method === 'GET'
    );
    expect(statusHandler).toBeDefined();
  });
  
  it('should have proper document status path format', () => {
    // statusハンドラーのパス形式
    const statusHandler = handlers.find(
      (handler) => handler.info.path === '/api/documents/:documentId/status'
    );
    // パスにdocumentIdパラメータが含まれているか
    expect(statusHandler?.info.path).toContain(':documentId');
  });
});
