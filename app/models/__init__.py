"""モデル定義のパッケージです。"""

# user.py (CustomUserモデル)を先にインポートし、その後に依存するモデルをインポート
from app.models.user import CustomUser
from app.models.user_settings import UserSettings

__all__ = ['CustomUser', 'UserSettings']
