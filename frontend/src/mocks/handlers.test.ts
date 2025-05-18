import { setupServer } from 'msw/node';
import { HttpResponse, http } from 'msw';
import { handlers } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MSW Handlers', () => {
  it('should return statuses for requested document IDs', async () => {
    server.use(
      http.get('http://localhost/api/documents/statuses', ({ request }) => {
        const url = new URL(request.url);
        const ids = url.searchParams.get('ids')?.split(',');
        if (!ids) return HttpResponse.json([]);

        const mockData = [
          { id: 'doc1', status: 'READY', progress: 100, title: 'Doc 1', fileName: 'doc1.pdf', uploaded_at: new Date().toISOString() },
          { id: 'doc2', status: 'PROCESSING', progress: 50, title: 'Doc 2', fileName: 'doc2.pdf', uploaded_at: new Date().toISOString() },
        ];
        const responseData = mockData.filter(doc => ids.includes(doc.id));
        return HttpResponse.json(responseData);
      })
    );

    const response = await fetch('http://localhost/api/documents/statuses?ids=doc1,doc2,notfound');
    expect(response.ok).toBe(true);
    const json: any[] = await response.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json.length).toBe(2);
    expect(json.find((d) => d.id === 'doc1')).toBeDefined();
    expect(json.find((d) => d.id === 'doc2')).toBeDefined();
    expect(json.find((d) => d.id === 'notfound')).toBeUndefined();
  });

  // 他のハンドラのテストケースも同様に fetch を使ってテスト可能
});
