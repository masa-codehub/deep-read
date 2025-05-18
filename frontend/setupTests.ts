import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetch, { Response, Request, Headers } from 'node-fetch';
import { vi, beforeAll, afterAll, afterEach } from 'vitest';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder;
}
if (typeof globalThis.fetch === 'undefined') {
  // @ts-ignore
  globalThis.fetch = fetch;
  // @ts-ignore
  globalThis.Response = Response;
  // @ts-ignore
  globalThis.Request = Request;
  // @ts-ignore
  globalThis.Headers = Headers;
}
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    constructor(public readonly name: string) {}
    postMessage() {}
    onmessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
  globalThis.BroadcastChannel = MockBroadcastChannel as any;
}

// MSWサーバのグローバルセットアップ
import { server } from './src/mocks/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
