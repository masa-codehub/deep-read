import '@testing-library/jest-dom';

// Jest環境でTextEncoderが未定義の場合にpolyfill
import { TextEncoder } from 'util';
if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}

// Jest環境でResponse, Request, Headersが未定義の場合にpolyfill
import fetch, { Response, Request, Headers } from 'node-fetch';
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = Response;
  globalThis.Request = Request;
  globalThis.Headers = Headers;
}

// MSWが必要とするBroadcastChannelのモック
if (typeof globalThis.BroadcastChannel === 'undefined') {
  class MockBroadcastChannel {
    constructor(public readonly name: string) {}
    postMessage() {}
    onmessage() {}
    close() {}
  }
  globalThis.BroadcastChannel = MockBroadcastChannel as any;
}
