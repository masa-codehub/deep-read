"""
Django settings for app project.

本番環境用設定ファイル - 本番環境特有の設定を記述します
"""

import os
import sys
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
    # テスト実行中かどうかを確認
    is_testing = 'test' in sys.argv or 'pytest' in sys.modules

    # 本番環境またはDATABASE_URLが設定されている場合のみ設定を適用
    database_url = os.environ.get('DATABASE_URL')
    if not is_testing and database_url:
        DATABASES = {
            'default': dj_database_url.parse(
                database_url,
                conn_max_age=600,
                ssl_require=os.environ.get('DJANGO_DB_SSL_REQUIRED') == 'True'
            )
        }
    # テスト中または環境変数がない場合はbase.pyのデフォルト設定を使用
except ImportError:
    # dj_database_url がインストールされていない場合はエラーログを出力
    print("Warning: dj-database-url package is not installed. Using default database settings.", file=sys.stderr)

# 本番環境では CSP の違反をブロックする
# 新しい形式のCSP設定
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # base.pyからディレクティブを継承
        'default-src': ("'none'",),
        'script-src': ("'self'",),
        'style-src': ("'self'",),
        'img-src': ("'self'", "data:"),
        'font-src': ("'self'",),
        'connect-src': ("'self'",),
        'form-action': ("'self'",),
        'frame-ancestors': ("'none'",),
        'object-src': ("'none'",),
        'base-uri': ("'self'",),
    },
    'REPORT_ONLY': False,  # 本番環境では実際にブロックする
    'REPLACE': True,  # 基本設定を上書き
}

# 古い形式の設定はコメントアウト
# CSP_REPORT_ONLY = False

# ここに本番環境用のセキュリティ設定を追加
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True  # Webサーバー側で処理しない場合
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'  # リファラーポリシーを追加

# 静的ファイル配信 (WhiteNoise を使用する場合はコメントを解除)
# WhiteNoiseを使用する場合は以下の行のコメントアウトを解除し、requirements.txtにwhitenoiseを追加してください
# STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
# MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')  # SecurityMiddleware の次

# Qdrant設定の本番環境向け上書き
QDRANT_HOST = os.environ.get('QDRANT_HOST', 'qdrant')
QDRANT_PORT = int(os.environ.get('QDRANT_PORT', 6333))
