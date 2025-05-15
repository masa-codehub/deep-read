import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * この設定で、定義したハンドラを持つService Workerを設定します
 */
export const worker = setupWorker(...handlers);
