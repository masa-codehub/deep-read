"""
Django settings for app project.

開発用環境設定ファイル - 開発環境に特化した設定を記述します
"""

from .base import *  # base.pyの設定を継承

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True  # 開発時はTrue (環境変数で上書き可能)

ALLOWED_HOSTS = ['*']  # 開発時は '*' や 'localhost', '127.0.0.1' を許可

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
