"""Celeryの設定モジュールです。

このモジュールはCeleryのインスタンス作成と設定を行います。
"""

import os

from celery import Celery

# Djangoの設定モジュールをデフォルトとして設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings.development')

# Celeryアプリケーションを作成
app = Celery('app')

# Django設定モジュールから設定をロード
app.config_from_object('django.conf:settings', namespace='CELERY')

# 登録されたDjangoアプリケーションの tasks.py モジュールからタスクを自動的にロード
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """デバッグ用のタスクです。"""
    print(f'Request: {self.request!r}')
