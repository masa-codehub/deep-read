"""
Celery タスク定義

非同期実行するバックグラウンドタスクを定義するモジュールです。
"""
import time
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def add(self, x, y):
    """
    シンプルな足し算を行うタスク（動作確認用）

    Args:
        x (int): 足される数
        y (int): 足す数

    Returns:
        int: 計算結果

    Raises:
        ValueError: xが0の場合に例外を発生（エラーハンドリングのテスト用）
    """
    try:
        logger.info(
            f'Executing task id {self.request.id}, args: {self.request.args}, kwargs: {self.request.kwargs}')
        # 時間のかかる処理を模倣
        time.sleep(1)

        # エラーテスト用
        if x == 0:
            raise ValueError("x cannot be zero!")

        result = x + y
        logger.info(f'Task {self.request.id} completed. Result: {result}')
        return result
    except Exception as exc:
        logger.error(f'Task {self.request.id} failed: {exc}')
        # リトライ間隔を指数関数的に増やす
        raise self.retry(exc=exc, countdown=5**self.request.retries)
