/**
 * CSRFトークンをmetaタグから取得するユーティリティ
 */
export const getCsrfToken = (): string => {
  if (typeof document !== 'undefined') {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }
  return '';
};
