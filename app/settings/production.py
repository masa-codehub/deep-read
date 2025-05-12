"""Django settings for app project.

本番環境用設定ファイル - 本番環境特有の設定を記述します。
"""

import os

# pylint: disable=wildcard-import,unused-wildcard-import
from .base import *  # noqa

# デバッグモードを無効にする
DEBUG = False

# 本番環境ではALLOWED_HOSTSを設定する
ALLOWED_HOSTS = [
    os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')
]

# 本番環境用データベース設定
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'deep_read'),
        'USER': os.environ.get('DB_USER', 'postgres'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# 本番環境のセキュリティ設定
SECRET_KEY = os.environ.get('SECRET_KEY')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # 365日
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Content Security Policy設定
CONTENT_SECURITY_POLICY = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", "data:"],
    'connect-src': ["'self'"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'media-src': ["'self'"],
    'frame-src': ["'none'"],
}

# Qdrant本番設定
QDRANT_HOST = os.environ.get('QDRANT_HOST', 'qdrant')
QDRANT_PORT = int(os.environ.get('QDRANT_PORT', 6334))

# Logging override for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {  # Production might still log to console for containerized environments
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        # Optional: File handler for production
        # 'file': {
        #     'level': 'INFO',
        #     'class': 'logging.handlers.RotatingFileHandler',
        #     'filename': '/var/log/django/app.log',  # Ensure this path exists and is writable
        #     'maxBytes': 1024 * 1024 * 10,  # 10MB
        #     'backupCount': 5,
        #     'formatter': 'verbose',
        # },
        # Optional: Mail admins for critical errors
        # 'mail_admins': {
        #     'level': 'ERROR',
        #     'class': 'django.utils.log.AdminEmailHandler',
        #     # 'include_html': True,  # Uncomment if you want HTML emails
        # }
    },
    'loggers': {
        'django': {
            'handlers': ['console'],  # Add 'file', 'mail_admins' as needed
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['console'],  # Add 'mail_admins' for critical request errors
            'level': 'ERROR',
            'propagate': False,
        },
        'app': {
            'handlers': ['console'],  # Add 'file' as needed
            'level': 'INFO',  # INFO level for production
            'propagate': True,
        },
    },
}

# Ensure ADMINS and SERVER_EMAIL are set if using AdminEmailHandler
# ADMINS = [('Admin Name', 'admin@example.com')]
# SERVER_EMAIL = 'noreply@example.com'
