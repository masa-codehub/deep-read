"""このファイルはapp.settingsをPythonパッケージとして認識させるために必要です。

環境変数DJANGOへSETTINGS_MODULEが設定されていない場合は、デフォルトでdevelopment設定を使用します。
"""

import os

# 環境変数DJANGO_SETTINGS_MODULEが未設定の場合は開発環境を使用
# 本番環境では環境変数 DJANGO_SETTINGS_MODULE=app.settings.production を設定して上書きします
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings.development')
