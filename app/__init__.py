"""
DeepReadアプリケーションパッケージ
"""

# Celeryアプリをインポートして、Django起動時に自動的にCeleryアプリがロードされるようにする
from .celery import app as celery_app

__all__ = ('celery_app',)
