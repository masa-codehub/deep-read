"""
Development環境の設定モジュール。

開発環境固有の設定を定義します。
"""

from .base import *  # noqa

# デバッグモードを有効にする
DEBUG = True

# 開発用データベース設定
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 開発用のCORS設定
CORS_ALLOW_ALL_ORIGINS = True

# 開発用のセキュリティ設定
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0

# Qdrant開発設定
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
