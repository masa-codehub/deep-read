import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './presentation/styles/index.css'
import App from './App.tsx'

/**
 * モックサーバーを有効化する関数
 * 開発環境のみで動作します
 */
async function enableMocking() {
  // 開発環境でのみMSWを有効化
  if (!import.meta.env.DEV) {
    return;
  }

  const { worker } = await import('./mocks/browser');
  
  // onUnhandledRequest オプションを設定すると、
  // MSWが処理しないリクエストの扱いを指定できます
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

// MSWを初期化してからアプリケーションをレンダリング
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
