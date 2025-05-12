"""Development環境の設定モジュール。

開発環境固有の設定を定義します。
"""

# pylint: disable=wildcard-import,unused-wildcard-import
from .base import *  # noqa
from .base import BASE_DIR  # 明示的にBASE_DIRをインポート

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
# QDRANT_HOST = "localhost"
# QDRANT_PORT = 6333

# Logging override for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',  # Override to DEBUG for development
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',  # Ensure 'verbose' formatter is defined in base.py or here
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',  # More verbose for requests in development
            'propagate': False,
        },
        'app': {
            'handlers': ['console'],
            'level': 'DEBUG',  # Override to DEBUG for development
            'propagate': True,
        },
    },
}

# ==============================================================================
# Email Settings (Development Override)
# ==============================================================================

# 開発環境ではコンソールにメール内容を出力する
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# 開発用のデフォルト送信元メールアドレス (任意)
# DEFAULT_FROM_EMAIL = 'dev-noreply@example.com'

# MailHogを使用する場合の例 (コメントアウト)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'localhost'  # MailHogがローカルで動作している場合
# EMAIL_PORT = 1025
# EMAIL_USE_TLS = False
# EMAIL_USE_SSL = False
# EMAIL_HOST_USER = '' # MailHogは通常認証不要
# EMAIL_HOST_PASSWORD = '' # MailHogは通常認証不要
