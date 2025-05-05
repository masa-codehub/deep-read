"""
Django settings for app project.

開発用環境設定ファイル - 開発環境に特化した設定を記述します
"""

from .base import *  # base.pyの設定を継承

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True  # 開発時はTrue (環境変数で上書き可能)

# 開発環境では特定のホストのみを許可する
# Docker等を使用する場合は、必要に応じてコンテナ名やサービス名を追加してください
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

# 開発時に便利なツールなどを追加
INSTALLED_APPS += [
    # 'debug_toolbar',  # 例: django-debug-toolbar
]

MIDDLEWARE += [
    # 'debug_toolbar.middleware.DebugToolbarMiddleware',  # 例: django-debug-toolbar
]

# INTERNAL_IPS = ['127.0.0.1']  # 例: django-debug-toolbar 用

# Database (開発用SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Email (開発時はコンソールに出力)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CSPの開発環境特有の設定
# 開発中のためCSPを緩和し、開発効率を高める設定
# 新しい形式の設定
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # base.pyから継承したデフォルト設定
        'default-src': ("'none'",),
        # 開発環境用の特定の設定
        # 開発時は'unsafe-inline'と'unsafe-eval'を許可
        'script-src': ("'self'", "'unsafe-inline'", "'unsafe-eval'"),
        'style-src': ("'self'", "'unsafe-inline'"),  # 開発時は'unsafe-inline'を許可
        # 開発サーバーとの接続を許可
        'connect-src': ("'self'", "http://localhost:*", "ws://localhost:*"),
    },
    'REPORT_ONLY': True,  # 開発環境でもレポートのみモード
    'EXCLUDE_URL_PREFIXES': ('/admin',),  # 管理画面では除外
    'REPLACE': True,  # 基本設定を上書き
}

# 古い形式の設定はコメントアウト
# CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
# CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "'unsafe-eval'")
# CSP_CONNECT_SRC = ("'self'", "http://localhost:*", "ws://localhost:*")
# CSP_EXCLUDE_URL_PREFIXES = ('/admin',)
