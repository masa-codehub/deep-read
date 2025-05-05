"""
Celery アプリケーション設定

非同期タスク実行のためのCeleryアプリケーションを設定します。
"""
import os
from celery import Celery

# Django settings モジュールを Celery プログラムのために設定
# 環境変数 DJANGO_SETTINGS_MODULE が設定されていなければデフォルトを設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings.development')

# Celery アプリケーションインスタンスを作成 (プロジェクト名を指定)
app = Celery('deepread')

# Django settings.py から Celery 設定を読み込む
# namespace='CELERY' を指定すると、settings.py 内の 'CELERY_' プレフィックスを持つ設定が読み込まれる
app.config_from_object('django.conf:settings', namespace='CELERY')

# Django アプリケーション内の tasks.py を自動検出
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """
    デバッグ用タスク。Celeryの設定が正しく機能しているかをテストするために使用。
    """
    print(f'Request: {self.request!r}')
