"""SearchアプリケーションのDjango AppConfig"""

import logging
from django.apps import AppConfig


logger = logging.getLogger(__name__)


class SearchConfig(AppConfig):
    """検索機能に関する設定を定義するAppConfig

    ベクトル検索やQdrant関連の初期化を行います。
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.adapters.search'

    def ready(self):
        """アプリケーション起動時に必要なQdrantコレクションを初期化"""
        # AppConfigのready()はDjango起動時に呼び出される
        # この処理はウェブサーバーの各プロセス起動時に実行されるため注意
        try:
            from app.adapters.search.qdrant_manager import ensure_collections_exist
            ensure_collections_exist()
        except Exception as e:
            # 接続エラーなどがあっても、アプリケーション起動は継続するが
            # 明示的に警告ログを出力して問題を通知する
            logger.warning(f"Qdrantコレクションの初期化中にエラーが発生しました: {str(e)}")
            # ロギングは ensure_collections_exist() 内でも詳細が記録されている
