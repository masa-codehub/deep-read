"""Celery非同期処理基盤のテストです。

CeleryとRedisを使った非同期処理基盤の動作確認テスト。
"""
from celery.exceptions import Retry
from django.test import TestCase, override_settings

from app.tasks import add


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class CeleryIntegrationTest(TestCase):
    """Celeryタスクのテストケースです。

    Celeryタスクが正常に動作するかを確認するための結合テスト。
    """

    def test_add_task(self):
        """Celeryのaddタスクが正常に動作することを確認します。"""
        # タスク実行
        result = add.delay(4, 4)

        # 結果が8であることを確認
        self.assertEqual(result.get(), 8)

    def test_add_task_error_handling(self):
        """エラー発生時の処理を確認します。"""
        # エラー時の動作をテスト（例外をキャッチ）
        with self.assertRaises(Retry):
            add.delay(0, 5).get()  # 0を渡すとエラーになり、Retry例外が発生することを確認
