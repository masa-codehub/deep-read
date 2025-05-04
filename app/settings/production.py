"""
Django settings for app project.

本番環境用設定ファイル - 本番環境特有の設定を記述します
"""

import os
from .base import *  # base.pyの設定を継承

# SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY は base.py で環境変数から読み込む想定

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False  # 本番環境では必ず False

# ALLOWED_HOSTS は base.py で環境変数から読み込む想定
# 例: export DJANGO_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (本番用 PostgreSQL 等を環境変数から設定する例)
try:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(
            conn_max_age=600,
            ssl_require=True if os.environ.get(
                'DJANGO_DB_SSL_REQUIRED') == 'True' else False
        )
        # 例: DATABASE_URL=postgres://user:password@host:port/dbname
    }
except ImportError:
    # dj_database_url がインストールされていない場合のフォールバック
    pass

# ここに本番環境用のセキュリティ設定を追加
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True  # Webサーバー側で処理しない場合

# 静的ファイル配信 (WhiteNoise などを使用する場合)
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
# MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')  # SecurityMiddleware の次
