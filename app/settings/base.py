"""Django settings for app project.

共通設定ファイル - 環境に依存しない設定を記述します
"""

import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# settings/ の親の親 = ルートディレクトリ
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get(
    # 環境変数から取得
    'DJANGO_SECRET_KEY', 'django-insecure-emfl7ebu*@(x=)fo-9dqk(u632(k6s58q33w^c4tbr(br-3kl(')

# SECURITY WARNING: don't run with debug turned on in production!
# 環境変数から取得 (文字列'True'かどうか)
DEBUG = os.environ.get('DJANGO_DEBUG', 'False') == 'True'

ALLOWED_HOSTS_STRING = os.environ.get('DJANGO_ALLOWED_HOSTS')
ALLOWED_HOSTS = ALLOWED_HOSTS_STRING.split(',') if ALLOWED_HOSTS_STRING else []

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'csp',  # Content Security Policy用のアプリを追加
    'app',  # プロジェクト自体のアプリケーション（モデル定義など）
    'app.adapters.search',  # ベクトル検索アダプターアプリケーション
]

# カスタムユーザーモデルの設定
AUTH_USER_MODEL = 'app.CustomUser'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware',  # CSPミドルウェアを追加
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'app.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],  # プロジェクトルートにtemplatesディレクトリを置く場合
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'app.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
# DB設定は development.py / production.py で上書きするか、環境変数を使う (後で設定)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',  # 開発用デフォルト
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/
LANGUAGE_CODE = 'ja'  # 日本語に変更
TIME_ZONE = 'Asia/Tokyo'  # タイムゾーンを東京に変更
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'  # collectstatic で集める場所
STATICFILES_DIRS = [
    BASE_DIR / "static",  # プロジェクトルートに static ディレクトリを置く場合
]

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==============================================================================
# Celery Settings
# ==============================================================================

# メッセージブローカーのURL (Redis使用)
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')

# 結果バックエンドのURL (タスク結果や状態を保存する場合)
CELERY_RESULT_BACKEND = os.environ.get(
    'CELERY_RESULT_BACKEND', 'redis://redis:6379/0')

# 受け入れるコンテンツタイプ
CELERY_ACCEPT_CONTENT = ['json']

# タスクのシリアライザ
CELERY_TASK_SERIALIZER = 'json'

# 結果のシリアライザ
CELERY_RESULT_SERIALIZER = 'json'

# Djangoのタイムゾーンを使用
CELERY_TIMEZONE = TIME_ZONE

# タスク実行状態をトラッキング
CELERY_TASK_TRACK_STARTED = True

# 重いタスク用にワーカーが一度に取得するタスク数を1に制限
CELERY_WORKER_PREFETCH_MULTIPLIER = 1

# ==============================================================================
# Content Security Policy (CSP) Settings
# https://django-csp.readthedocs.io/en/latest/configuration.html
# ==============================================================================

# django-csp 4.0以降の新しい設定形式を使用
CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        # 基本ポリシー: まずは全てをブロックする
        'default-src': ("'none'",),

        # スクリプト: 自分自身のドメインからのみ許可
        'script-src': ("'self'",),

        # スタイルシート: 自分自身のドメインからのみ許可
        'style-src': ("'self'",),

        # 画像: 自分自身のドメインとdata:スキーム（インライン画像用）を許可
        'img-src': ("'self'", "data:"),

        # フォント: 自分自身のドメインからのみ許可
        'font-src': ("'self'",),

        # 接続 (XHR, WebSocket等): 自分自身のドメインへの接続のみ許可
        'connect-src': ("'self'",),

        # フォーム送信先: 自分自身のドメインのみ許可
        'form-action': ("'self'",),

        # フレーム埋め込み: 許可しない (X-Frame-Options: DENY相当)
        'frame-ancestors': ("'none'",),

        # プラグイン (<object>, <embed>, <applet>): 許可しない
        'object-src': ("'none'",),

        # <base> タグのURI: 自分自身のドメインのみ許可
        'base-uri': ("'self'",),
    },
    # レポートのみモードで実行（違反をブロックせず、報告のみ）
    'REPORT_ONLY': True,
    # CSPミドルウェアのデフォルト設定を上書きする - Djangoのドキュメントに従う
    'REPLACE': True,
}

# 古い形式の設定は削除または非推奨としてコメントアウト
# CSP_REPORT_ONLY = True
# CSP_DEFAULT_SRC = ("'none'",)
# CSP_SCRIPT_SRC = ("'self'",)
# CSP_STYLE_SRC = ("'self'",)
# CSP_IMG_SRC = ("'self'", "data:")
# CSP_FONT_SRC = ("'self'",)
# CSP_CONNECT_SRC = ("'self'",)
# CSP_FORM_ACTION = ("'self'",)
# CSP_FRAME_ANCESTORS = ("'none'",)
# CSP_OBJECT_SRC = ("'none'",)
# CSP_BASE_URI = ("'self'",)

# ==============================================================================
# Qdrant Vector Database Settings
# ==============================================================================

# Qdrantサーバーのホスト名
QDRANT_HOST = os.environ.get('QDRANT_HOST', 'qdrant')

# Qdrantサーバーのポート番号（gRPC用）
QDRANT_PORT = int(os.environ.get('QDRANT_PORT', 6334))  # デフォルトを6334に変更

# Qdrantへの接続タイムアウト設定（秒）
QDRANT_TIMEOUT = float(os.environ.get('QDRANT_TIMEOUT', '10.0'))

# コレクション名
QDRANT_COLLECTION_DOCUMENTS = "documents"  # ドキュメント用コレクション名
QDRANT_COLLECTION_QA = "qa_pairs"         # Q&Aペア用コレクション名

# ベクトルの次元数 - 環境変数から取得またはデフォルト値を使用
# 一般的なTransformerベースのモデル（例：BERT）のサイズをデフォルトとして設定
QDRANT_VECTOR_SIZE = int(os.environ.get('QDRANT_VECTOR_SIZE', 768))
